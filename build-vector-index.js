import { MongoClient } from 'mongodb';
// Connect to your Atlas cluster
const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);
async function run() {
  try {
    const database = client.db("rag_db");
    const collection = database.collection("test");

    // Define your Atlas Vector Search index
    const index = {
      name: "vector_index",
      type: "vectorSearch",
      definition: {
        "fields": [
          {
            "type": "vector",
            "path": "vector_embeddings",
            "similarity": "cosine",
            "numDimensions": 1024
          }
        ]
      }
    }

    // Call the method to create the index
    const result = await collection.createSearchIndex(index);
    console.log("Successfully created index: ", result);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
