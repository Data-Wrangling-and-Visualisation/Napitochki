use embed_anything::{embed_query,embeddings::embed::Embedder};
use std::{sync::Arc};


pub async fn get_text_embedding(model: &Arc<Embedder>, text: String) -> Vec<f32>{
    let query_emb_data = embed_query(&[&text], model, None).await.unwrap();
    let query_emb_data: Vec<f32> = query_emb_data.iter().flat_map(|x| x.embedding.to_dense().unwrap()).collect();
    return query_emb_data;
}