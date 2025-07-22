import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fs from 'fs';

console.log('Script started');
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'test'; // Change if you want a different DB
const COLLECTION_NAME = 'promos'; // Change if you want a different collection
const INPUT_FILE = 'legal-promo-examples.txt'; // Batch ingest from this file

async function run() {
  try {
    // Read input file
    console.log('Reading input file:', INPUT_FILE);
    if (!fs.existsSync(INPUT_FILE)) {
      console.error('Input file does not exist:', INPUT_FILE);
      return;
    }
    const fileContents = fs.readFileSync(INPUT_FILE, 'utf-8');
    // Split promos by double newlines (paragraphs)
    const promos = fileContents.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    console.log(`Found ${promos.length} promos to ingest.`);

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Insert all promos
    const docs = promos.map(promoText => ({
      promoText,
      insertedAt: new Date()
    }));
    const result = await collection.insertMany(docs);
    console.log('Insert result:', result);

    // Confirm inserted documents
    const inserted = await collection.find({ _id: { $in: Object.values(result.insertedIds) } }).toArray();
    console.log('Inserted documents:', inserted);

    await client.close();
    console.log('Script finished');
  } catch (err) {
    console.error('Error during ingestion:', err);
  }
}

run();