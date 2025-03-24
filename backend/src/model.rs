use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Drink {
    name: String, 
    recipie: Vec<String>, 
    category: String, 
    image_url: String, 
    drink_url: String, 
    taste: Vec<String>, 
}