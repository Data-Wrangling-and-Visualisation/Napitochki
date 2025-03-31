mod model; 
mod mongo_utils;
mod chroma_utils; 
mod clip;
mod categories; 

use model::Drink;
use mongo_utils::{get_mongo_client, get_drinks, get_by_name, get_by_url, get_by_tastes};  
use chroma_utils::{get_chroma_client, SimilarityResponse};
use clip::get_text_embedding;   

use strum::IntoEnumIterator;
use std::convert::AsRef;
use categories::TasteCategories; 

use chromadb::client::ChromaClient;

use std::collections::HashMap;  
use std::{sync::Arc};

use embed_anything::embeddings::embed::{Embedder, EmbedderBuilder};    
use axum::http::StatusCode;

use mongodb::{Collection};

use axum::{routing::{get}, Router, Json, extract::{State, Query}};
use axum::extract::Json as AxumJson;
use serde::Deserialize;

struct AppState {
    mongo_collection: Collection<Drink>,
    chroma_client: ChromaClient,
    model: Arc<Embedder>,
}


#[derive(Deserialize)]
struct DrinkQuery {
    name: Option<String>,
    drink_url: Option<String>,
    taste: Option<Vec<String>>,
}

async fn get_drink_handler(
    State(state): State<Arc<AppState>>,
    AxumJson(body): AxumJson<DrinkQuery>,
) -> Result<Json<Vec<Drink>>, StatusCode> {
    let collection = &state.mongo_collection;

    // Ensure only one parameter is passed
    let params_count = body.drink_url.is_some() as u8
        + body.name.is_some() as u8
        + body.taste.is_some() as u8;

    if params_count > 1 {
        return Err(StatusCode::BAD_REQUEST);
    }

    if let Some(drink_url) = body.drink_url {
        if let Some(drink) = get_by_url(collection, drink_url).await {
            return Ok(Json(vec![drink]));
        }
    } else if let Some(drink_name) = body.name {
        if let Some(drink) = get_by_name(collection, drink_name).await {
            return Ok(Json(vec![drink]));
        }
    } else if let Some(taste) = body.taste {
        if let Some(drinks) = get_by_tastes(collection, taste).await {
            return Ok(Json(drinks));
        }
    } else {
        let drinks = get_drinks(collection).await.unwrap();
        return Ok(Json(drinks));
    }

    Err(StatusCode::NOT_FOUND)
}


async fn get_embedding(
    State(state): State<Arc<AppState>>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<f32>>, StatusCode> {
    let model = &state.model;

    if let Some((key, value)) = params.iter().next() {
        match key.as_str() {
            "text" => {
                let text = value.to_string();
                let embedding = get_text_embedding(model, text).await; 
                return Ok(Json(embedding));
            }
            _ => {
                println!("Invalid query parameter: {}", key);
                return Err(StatusCode::NOT_FOUND);
            }
        }
    }

    println!("Unexpected error");
    Err(StatusCode::INTERNAL_SERVER_ERROR)
}

async fn chroma_similarity_search(
    State(state): State<Arc<AppState>>, 
    AxumJson(body): AxumJson<HashMap<String, serde_json::Value>>
) -> Json<SimilarityResponse> {
    let prompt = match body.get("prompt") {
        Some(serde_json::Value::String(p)) => p.clone(),
        _ => {
            return Json(SimilarityResponse {
                uris: vec![],
                distances: vec![],
            });
        }
    };

    let n_results = body.get("n_results")
        .and_then(|v| v.as_u64())
        .unwrap_or(10) as usize;

    let client = &state.chroma_client; 
    let model = &state.model;

    let embedding = get_text_embedding(model, prompt).await; 
    
    let similarity_response = chroma_utils::simiilarity_search(client, "drinks_text", embedding, n_results).await;
    return Json(similarity_response); 
}


async fn get_tastes()  -> Json<Vec<String>> {
    let tastes: Vec<String> = TasteCategories::iter().map(|taste| taste.as_ref().to_string()).collect();
    return Json(tastes)
}


#[tokio::main]
async fn main() {
    // init mongo connection
    let mongo_db_connection = get_mongo_client().await;
    let collection: Collection<Drink> = mongo_db_connection.collection("drinks"); 

    // init chroma client
    let chroma_client = get_chroma_client().await;

    // init embedding model 
    let model = EmbedderBuilder::new()
        .model_architecture("clip")
        .model_id(Some("openai/clip-vit-base-patch32"))
        .revision(Some("refs/pr/15"))
        .token(None)
        .from_pretrained_hf()
        .unwrap();
   

    let state = Arc::new(AppState{
        mongo_collection: collection, 
        chroma_client: chroma_client,
        model: Arc::new(model),
    });

    let app = Router::new()
        .route("/drinks", get(get_drink_handler))
        .route("/tastes", get(get_tastes))
        .route("/find_similar", get(chroma_similarity_search))
        .route("/embeddings", get(get_embedding))
        .with_state(state);

    axum::Server::bind(&"0.0.0.0:8888".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
