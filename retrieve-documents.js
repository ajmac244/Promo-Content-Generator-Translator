import { MongoClient } from 'mongodb';
import { getEmbedding } from './get-embeddings.js';


const NUM_CANDIDATES = 40;
const EXACT = false;
const LIMIT = 5;

// Function to get the results of a vector query
export async function getQueryResults(query) {
  // Connect to your Atlas cluster
  const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);

  try {
    // Get embedding for a query
    const queryEmbedding = await getEmbedding(query);
    await client.connect();
    const db = client.db("rag_db");
    const collection = db.collection("test");
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          queryVector: queryEmbedding,
          path: "vector_embeddings",
          numCandidates: NUM_CANDIDATES,
          exact: EXACT,
          limit: LIMIT,
        }
      },
      {
        $project: {
          vector_embeddings: 1,
          text: 1,
          page_number: 1,
          score: {
            $meta: "vectorSearchScore"
          }
        }
      }
    ];
    // Retrieve documents from Atlas using this Vector Search query
    const result = collection.aggregate(pipeline);
    const arrayOfQueryDocs = [];
    for await (const doc of result) {
      arrayOfQueryDocs.push(doc);
    }
    return arrayOfQueryDocs;
  } catch (err) {
    console.log(err.stack);
  }
  finally {
    await client.close();
  }
}