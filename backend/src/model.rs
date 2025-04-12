use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct Drink {
    pub name: String, 
    pub recipie: Vec<String>, 
    pub category: String, 
    pub image_url: String, 
    pub drink_url: String, 
    pub taste: Vec<String>, 
    pub cluster: i32, 
    pub position: HashMap<String, Vec<f32>>, 
}

#[derive(Deserialize)]
pub struct DrinkQuery {
    pub name: Option<String>,
    pub drink_url: Option<String>,
    pub taste: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize)]
pub struct SimilarityResponse {
    pub uris: Vec<String>,
    pub distances: Vec<f32>,
}

#[derive(Serialize, Deserialize)]
pub struct SimilarityExtendedResponse {
    pub drinks: Vec<Drink>, 
    pub distances: Vec<f32>,
}