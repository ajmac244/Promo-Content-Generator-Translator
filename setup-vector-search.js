import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'promos';

async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002'
    })
  });
  const data = await response.json();
  return data.data[0].embedding;
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  // Get all promos that don't have embeddings yet
  const promos = await collection.find({ 
    headline: { $exists: true },
    embedding: { $exists: false }
  }).toArray();

  console.log(`Found ${promos.length} promos to generate embeddings for.`);

  for (const promo of promos) {
    console.log('Generating embedding for:', promo.headline);
    
    try {
      // Create text for embedding (combine headline, description, and promo type)
      const textForEmbedding = `${promo.headline} ${promo.description} ${promo.promo_type || ''}`;
      
      const embedding = await generateEmbedding(textForEmbedding);
      
      await collection.updateOne(
        { _id: promo._id },
        { $set: { embedding: embedding } }
      );
      
      console.log('✅ Embedding generated and saved.');
    } catch (error) {
      console.error('❌ Error generating embedding:', error.message);
    }
  }

  await client.close();
  console.log('All embeddings generated!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Go to MongoDB Atlas');
  console.log('2. Navigate to your collection');
  console.log('3. Go to "Indexes" tab');
  console.log('4. Click "Create Search Index"');
  console.log('5. Choose "JSON Editor" and paste this configuration:');
  console.log('');
  console.log('{');
  console.log('  "mappings": {');
  console.log('    "dynamic": true,');
  console.log('    "fields": {');
  console.log('      "embedding": {');
  console.log('        "dimensions": 1536,');
  console.log('        "similarity": "cosine",');
  console.log('        "type": "knnVector"');
  console.log('      }');
  console.log('    }');
  console.log('  }');
  console.log('}');
}

run().catch(console.error);
