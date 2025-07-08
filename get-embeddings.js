import { VoyageAIClient } from 'voyageai';

const EMBEDDING_MODEL = "voyage-3-large";

// Set up Voyage AI configuration
const client = new VoyageAIClient({apiKey: process.env.VOYAGE_API_KEY});

// Function to generate embeddings using the Voyage AI API
export async function getEmbedding(text, model) {
  const results = await client.embed({
    input: text,
    model: EMBEDDING_MODEL
  });
  return results.data[0].embedding;
}

// Function to generate batch embeddings using the Voyage AI API
export async function getEmbeddings(texts, model) {
  const results = await client.embed({
    input: texts,
    model: EMBEDDING_MODEL
  });
  return results.data.map(datum => datum.embedding);
}
