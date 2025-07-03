import { VoyageAIClient } from 'voyageai';

// Set up Voyage AI configuration
const client = new VoyageAIClient({apiKey: process.env.VOYAGE_API_KEY});

// Function to generate embeddings using the Voyage AI API
export async function getEmbedding(text, model) {
  const results = await client.embed({
    input: text,
    model
  });
  return results.data[0].embedding;
}
