mod model; 
mod mongo_utils; 

use model::Drink;
use mongo_utils::{get_mongo_client, get_drinks, get_by_name, get_by_url};  

use std::sync::Arc;
use std::collections::HashMap;  

use mongodb::{Collection}; 
use axum::{
    routing::{get},
    Router,
    Json,
    extract::{State, Query}, 
};

struct AppState {
    mongo_collection: Collection<Drink>,
}


use axum::http::StatusCode;

async fn get_drink_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Vec<Drink>>, StatusCode> {
    println!("get drinks route {:?}", params);

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

    println!("Unexpected error");
    Err(StatusCode::INTERNAL_SERVER_ERROR)
}

#[tokio::main]
async fn main() {
    let mongo_db_connection = get_mongo_client().await;
    let collection = mongo_db_connection.collection("drinks"); 
    let state =Arc::new(AppState{mongo_collection: collection });

    let app = Router::new()
        .route("/drinks", get(get_drink_handler))
        .with_state(state);

    axum::Server::bind(&"0.0.0.0:8888".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
