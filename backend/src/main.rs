mod model; 
mod mongo_utils;
mod chroma_utils; 
mod clip;
mod categories; 

use std::{collections::HashMap, fs, sync::Arc};

use axum::{
    extract::{State, Query, Json as AxumJson},
    http::StatusCode,
    routing::{post},
    Json, Router,
};

use tower_http::cors::{Any, CorsLayer};

use embed_anything::embeddings::embed::{Embedder, EmbedderBuilder};
use mongodb::Collection;
use serde_json::Value;
use strum::IntoEnumIterator;

use chromadb::client::ChromaClient;

use categories::TasteCategories;
use clip::get_text_embedding;
use chroma_utils::get_chroma_client;
use mongo_utils::{
    get_by_name, get_by_tastes, get_by_url, get_by_urls, get_drinks, get_mongo_client,
};
use model::{Drink, DrinkQuery, SimilarityExtendedResponse};


struct AppState {
    mongo_collection: Collection<Drink>,
    chroma_client: ChromaClient,
    model: Arc<Embedder>,
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
    AxumJson(body): AxumJson<HashMap<String, Value>>
) -> Json<SimilarityExtendedResponse> {
    let prompt = match body.get("prompt") {
        Some(Value::String(p)) => p.clone(),
        _ => {
            return Json(SimilarityExtendedResponse {
                drinks: vec![],
                distances: vec![],
            });
        }
    };

    let n_results = body.get("n_results")
        .and_then(|v| v.as_u64())
        .unwrap_or(10) as usize;

    let chroma_client = &state.chroma_client; 
    let mongo_collection = &state.mongo_collection;
    let model = &state.model;

    let embedding = get_text_embedding(model, prompt).await; 
    
    let similarity_response = chroma_utils::simiilarity_search(chroma_client, "drinks_text", embedding, n_results).await;

    let drinks_data = get_by_urls(mongo_collection, similarity_response.uris).await.unwrap();

    return Json(SimilarityExtendedResponse{
        drinks: drinks_data, 
        distances: similarity_response.distances
    }); 
}

async fn get_network() -> Result<Json<Value>, StatusCode> {
    // load the two JSON files
    let verts = fs::read_to_string("./assets/co_occurrence_vertices.json")
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let edges = fs::read_to_string("./assets/co_occurrence_edges.json")
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // parse them
    let vertices: Value =
        serde_json::from_str(&verts).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let edges: Value =
        serde_json::from_str(&edges).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // build combined object
    let mut map = serde_json::Map::new();
    map.insert("vertices".to_string(), vertices);
    map.insert("edges".to_string(), edges);

    Ok(Json(Value::Object(map)))
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

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any) 
        .allow_headers(Any); 

    let app = Router::new()
        .route("/drinks", post(get_drink_handler))
        .route("/tastes", post(get_tastes))
        .route("/find_similar", post(chroma_similarity_search))
        .route("/embeddings", post(get_embedding))
        .route("/network", post(get_network))
        .with_state(state)
        .layer(cors);

    axum::Server::bind(&"0.0.0.0:8888".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
