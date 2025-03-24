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

pub async fn get_drinks(collection: &Collection<Drink>) -> Result<Vec<Drink>, mongodb::error::Error> {
    let mut cursor = collection.find(doc! {}, None).await?;
    let mut drinks = Vec::new();

    while let Some(doc) = cursor.try_next().await? {
        drinks.push(doc);
    }

    Ok(drinks)
}

pub async fn get_by_name(collection: &Collection<Drink>, name: String) -> Result<Drink, mongodb::error::Error> {
    let result = (*collection).find_one(doc! {"name": name}, None).await?;

    return Ok(result.expect("get_by_name db provider runtime error"));   
}

pub async fn get_by_url(collection: &Collection<Drink>, url: String) -> Result<Drink, mongodb::error::Error> {
    let result = (*collection).find_one(doc! {"drink_url": url}, None).await?;

    return Ok(result.expect("get_by_url db provider runtime error"));   
}