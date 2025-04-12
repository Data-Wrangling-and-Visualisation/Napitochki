use chromadb::client::{ChromaAuthMethod, ChromaClient, ChromaClientOptions, ChromaTokenHeader};
use chromadb::collection::{QueryOptions, QueryResult};
use crate::model::SimilarityResponse; 


pub async fn get_chroma_client() -> ChromaClient {
    dotenvy::dotenv().expect("Failed to load .env file");

    let url = dotenvy::var("CHROMA_URL").expect("CHROMA_URL must be set");
    let token = dotenvy::var("CHROMA_TOKEN").expect("CHROMA_TOKEN must be set");

    let auth = ChromaAuthMethod::TokenAuth {
        token: token,
        header: ChromaTokenHeader::Authorization
    };

    let client: ChromaClient = ChromaClient::new(ChromaClientOptions {
        url: Some(format!("http://{}:8000", url)),
        database: "default_database".to_string(),
        auth
    }).await.unwrap();

    return client; 
}

fn extract_uris_and_distances(query_result: &QueryResult) -> (Vec<String>, Vec<f32>) {
    let mut uris = Vec::new();
    let mut distances = Vec::new();

    if let Some(metadata_list) = &query_result.metadatas {
        for metadata_group in metadata_list {
            for metadata in metadata_group {
                if let Some(metadata_map) = metadata {
                    if let Some(uri) = metadata_map.get("uri") {
                        if let Some(uri_str) = uri.as_str() {
                            uris.push(uri_str.to_string());
                        }
                    }
                }
            }
        }
    }

    if let Some(distance_list) = &query_result.distances {
        for distance_group in distance_list {
            for distance in distance_group {
                distances.push(*distance);
            }
        }
    }

    (uris, distances)
}

pub async fn simiilarity_search(client: &ChromaClient, collection_name: &str, query: Vec<f32>,  n_results: usize) -> SimilarityResponse {
    let collection = client.get_collection(collection_name).await.unwrap();

    let query = QueryOptions {
        query_texts: None,
        query_embeddings: Some(vec![query]),
        where_metadata: None,
        where_document: None,
        n_results: Some(n_results),
        include: Some(vec!["metadatas", "distances"]),
    };

    let query_result: QueryResult = collection.query(query, None).await.unwrap();
    let (uris, distances) = extract_uris_and_distances(&query_result);
    return SimilarityResponse {
        uris,
        distances,
    };
}