import { VoyageAIClient } from 'voyageai';

// Specify the voyage embedding model
const EMBEDDING_MODEL = "voyage-3-large";

// Set up Voyage AI configuration
const client = new VoyageAIClient({apiKey: process.env.VOYAGE_API_KEY});

// Function to generate embeddings using the Voyage AI API
export async function getEmbedding(text) {
  const results = await client.embed({
    input: text,
    model: EMBEDDING_MODEL
  });
  return results.data[0].embedding;
}
