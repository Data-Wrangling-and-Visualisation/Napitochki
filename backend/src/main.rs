mod model; 
mod mongo_utils;
mod chroma_utils; 
mod clip;
mod categories; 

use model::Drink;
use mongo_utils::{get_mongo_client, get_drinks, get_by_name, get_by_url};  
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

struct AppState {
    mongo_collection: Collection<Drink>,
    chroma_client: ChromaClient,
    model: Arc<Embedder>,
}


async fn get_drink_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<Drink>>, StatusCode> {
    let collection = &state.mongo_collection;

    if params.is_empty() {
        let drinks = get_drinks(collection).await.unwrap();
        return Ok(Json(drinks));
    }

    if let Some((key, value)) = params.iter().next() {
        let mut res = vec![];
        match key.as_str() {
            "name" => {
                let drink = get_by_name(collection, value.to_string()).await.unwrap();
                res.push(drink);
            }
            "url" => {
                let drink = get_by_url(collection, value.to_string()).await.unwrap();
                res.push(drink);
            }
            _ => {
                println!("Invalid query parameter: {}", key);
                return Err(StatusCode::NOT_FOUND);
            }
        }
        return Ok(Json(res));
    }

    Err(StatusCode::INTERNAL_SERVER_ERROR)
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

async fn chroma_similarity_search(State(state): State<Arc<AppState>>, Query(params): Query<HashMap<String, String>>) -> Json<SimilarityResponse>{
    if !params.contains_key("prompt") {
        return Json(SimilarityResponse {
            uris: vec![],
            distances: vec![],
        });
    }

    let client = &state.chroma_client; 
    let model = &state.model;

    let text = params.get("prompt").unwrap().to_string();   
    let embedding = get_text_embedding(model, text).await; 
    
    let similarity_response = chroma_utils::simiilarity_search(client, "drinks_text", embedding, 10).await;
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
