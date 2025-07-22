import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'promos';

async function extractPromoFields(promoText) {
  const prompt = `
Extract the following fields from this legal promo text and return as JSON (no markdown formatting):
- headline
- description
- cta
- states
- promo_type
- bet_amount
- bonus_amount
- valid_dates
- terms
- type (e.g., banner, widget, modal)
- size (if specified)
- placement (if specified)

Legal promo text:
"""
${promoText}
"""
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts structured data from legal promo text. Return only valid JSON, no markdown formatting.' },
        { role: 'user', content: prompt }
      ]
    })
  });
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Clean up markdown formatting if present
  let jsonContent = content;
  if (content.includes('```json')) {
    jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }
  
  try {
    return JSON.parse(jsonContent);
  } catch (e) {
    console.error('Failed to parse OpenAI response:', content);
    throw e;
  }
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  // Example: get all promos with only promoText field
  const promos = await collection.find({ promoText: { $exists: true } }).toArray();

  for (const promo of promos) {
    if (promo.headline) continue; // Skip if already processed
    console.log('Extracting fields for promo:', promo.promoText.slice(0, 60) + '...');
    const extracted = await extractPromoFields(promo.promoText);
    await collection.updateOne(
      { _id: promo._id },
      { $set: extracted }
    );
    console.log('Updated promo with extracted fields.');
  }

  await client.close();
  console.log('All promos processed!');
}

run().catch(console.error);


