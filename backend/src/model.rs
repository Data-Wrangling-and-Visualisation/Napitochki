use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// An object template with recipe details, categorization, and embedding metadata.
#[derive(Debug, Serialize, Deserialize)]
pub struct Drink {
    pub name: String, 
    pub recipie: Vec<String>, 
    pub category: String, 
    pub image_url: String, 
    pub drink_url: String, 
    pub taste: Vec<String>, 
    pub cluster: HashMap<String, i32>, 
    pub position: HashMap<String, Vec<f32>>, 
}

/// Query parameters for fetching drinks by name, URL, or taste.
#[derive(Deserialize)]
pub struct DrinkQuery {
    pub name: Option<String>,
    pub drink_url: Option<String>,
    pub taste: Option<Vec<String>>,
}


/// Similarity search response. 
#[derive(Serialize, Deserialize)]
pub struct SimilarityResponse {
    pub uris: Vec<String>,
    pub distances: Vec<f32>,
}

/// Extended similarity response including full drink objects.
#[derive(Serialize, Deserialize)]
pub struct SimilarityExtendedResponse {
    pub drinks: Vec<Drink>, 
    pub distances: Vec<f32>,
}