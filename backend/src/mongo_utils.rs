use crate::Drink;

use mongodb::{ 
    bson::doc,
    Client,
    Collection, 
    Database,
};

use futures::TryStreamExt;

pub async fn get_mongo_client() -> Database {
    dotenvy::dotenv().expect("Failed to load .env file");

    let uri = dotenvy::var("MONGO_CONNECTION_STRING").expect("MONGO_CONNECTION_STRING must be set");
    let client = Client::with_uri_str(uri).await.unwrap();
    let database = client.database("monin");
    return database; 
}

pub async fn get_drinks(collection: &Collection<Drink>) -> Option<Vec<Drink>> {
    let mut cursor = collection.find(doc! {}, None).await.ok()?;
    let mut drinks = Vec::new();

    while let Some(doc) = cursor.try_next().await.ok()? {
        drinks.push(doc);
    }

    Some(drinks)
}

pub async fn get_by_name(collection: &Collection<Drink>, name: String) -> Option<Drink> {
    collection.find_one(doc! {"name": name}, None).await.ok()?
}

pub async fn get_by_url(collection: &Collection<Drink>, url: String) -> Option<Drink> {
    collection.find_one(doc! {"drink_url": url}, None).await.ok()?
}

pub async fn get_by_urls(collection: &Collection<Drink>, urls: Vec<String>) -> Option<Vec<Drink>> {
    let mut cursor = collection.find(doc! {"drink_url": {"$in": urls}}, None).await.ok()?;
    let mut drinks = Vec::new();

    while let Some(doc) = cursor.try_next().await.ok()? {
        drinks.push(doc);
    }

    Some(drinks)
}

pub async fn get_by_tastes(collection: &Collection<Drink>, tastes: Vec<String>) -> Option<Vec<Drink>> {
    let mut cursor = collection.find(doc! {"taste": {"$all": tastes}}, None).await.ok()?;
    let mut drinks = Vec::new();

    while let Some(doc) = cursor.try_next().await.ok()? {
        drinks.push(doc);
    }

    Some(drinks)
}
