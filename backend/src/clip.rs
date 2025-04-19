use embed_anything::{embed_query,embeddings::embed::Embedder};
use std::{sync::Arc};

/// Generates a dense text embedding for the given input string.
///
/// This function sends the text to the provided Embedder model,
/// retrieves the embedding, converts it to a dense vector, and flattens
/// the result into a single Vec<f32>.
pub async fn get_text_embedding(model: &Arc<Embedder>, text: String) -> Vec<f32> {
    let query_emb_data = embed_query(&[&text], model, None)
        .await
        .unwrap();
    query_emb_data
        .iter()
        .flat_map(|x| x.embedding.to_dense().unwrap())
        .collect()
}