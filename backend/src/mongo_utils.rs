use crate::Drink;
use futures::TryStreamExt;

use mongodb::{ 
    bson::doc,
    Client,
    Collection, 
    Database,
};

/// Loads environment variables from .env and establishes a MongoDB connection.
/// 
/// Expects MONGO_CONNECTION_STRING to be set in the environment.
/// Returns the monin database handle.
pub async fn get_mongo_client() -> Database {
    dotenvy::dotenv().expect("Failed to load .env file");

    let uri = dotenvy::var("MONGO_CONNECTION_STRING").expect("MONGO_CONNECTION_STRING must be set");
    let client = Client::with_uri_str(uri).await.unwrap();
    let database = client.database("monin");
    return database; 
}

/// Retrieves all Drink documents from the given collection.
/// 
/// Returns Some(Vec<Drink>) on success or None if the query fails.
pub async fn get_drinks(collection: &Collection<Drink>) -> Option<Vec<Drink>> {
    let mut cursor = collection.find(doc! {}, None).await.ok()?;
    let mut drinks = Vec::new();

    while let Some(doc) = cursor.try_next().await.ok()? {
        drinks.push(doc);
    }

    Some(drinks)
}

/// Fetches a single Drink by its name field.
/// 
/// Returns Some(Drink) if found, or None if no matching document or on error.
pub async fn get_by_name(collection: &Collection<Drink>, name: String) -> Option<Drink> {
    collection.find_one(doc! {"name": name}, None).await.ok()?
}

/// Fetches a single Drink by its drink_url field.
/// 
/// Returns Some(Drink) if found, or None if no matching document or on error.
pub async fn get_by_url(collection: &Collection<Drink>, url: String) -> Option<Drink> {
    collection.find_one(doc! {"drink_url": url}, None).await.ok()?
}

/// Retrieves multiple Drink documents matching any of the provided URLs.
/// 
/// Maintains the ordering of the input urls in the returned vector.
/// Returns Some(Vec<Drink>) on success or None on error.
pub async fn get_by_urls(collection: &Collection<Drink>, urls: Vec<String>) -> Option<Vec<Drink>> {
    let mut drinks_map = std::collections::HashMap::new();
    let mut cursor = collection.find(doc! {"drink_url": {"$in": &urls}}, None).await.ok()?;

    while let Some(doc) = cursor.try_next().await.ok()? {
        let url= doc.drink_url.clone();
        drinks_map.insert(url, doc);
    }

    let mut ordered_drinks = Vec::new();
    for url in urls {
        if let Some(drink) = drinks_map.remove(&url) {
            ordered_drinks.push(drink);
        }
    }

    Some(ordered_drinks)
}

/// Retrieves all Drink documents that match all specified taste categories.
/// 
/// Returns Some(Vec<Drink>) with matching drinks or None on error.
pub async fn get_by_tastes(collection: &Collection<Drink>, tastes: Vec<String>) -> Option<Vec<Drink>> {
    let mut cursor = collection.find(doc! {"taste": {"$all": tastes}}, None).await.ok()?;
    let mut drinks = Vec::new();

    while let Some(doc) = cursor.try_next().await.ok()? {
        drinks.push(doc);
    }

    Some(drinks)
}
