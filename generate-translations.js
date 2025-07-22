import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'promos';

async function translatePromo(promoData, targetLanguage) {
  const prompt = `
Translate the following JSON object into ${targetLanguage}, keeping the exact same structure and only translating the values:

${JSON.stringify(promoData, null, 2)}

Requirements:
- Keep the same JSON structure
- Only translate the values (headline, description, cta, etc.)
- Keep states as they are (NY, NJ, etc.)
- Keep numbers and percentages as they are
- Return only valid JSON, no markdown formatting
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
        { role: 'system', content: `You are a helpful assistant that translates JSON objects into ${targetLanguage}.` },
        { role: 'user', content: prompt }
      ]
    })
  });
  const data = await response.json();
  let content = data.choices[0].message.content;
  
  // Clean up markdown formatting if present
  if (content.includes('```json')) {
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse translation response:', content);
    throw e;
  }
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  // Get all promos that have structured data but no translations
  const promos = await collection.find({ 
    headline: { $exists: true },
    translations: { $exists: false }
  }).toArray();

  console.log(`Found ${promos.length} promos to translate.`);

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'zh', name: 'Chinese' }
  ];

  for (const promo of promos) {
    console.log('Translating:', promo.headline);
    
    const translations = {};
    
    for (const lang of languages) {
      try {
        console.log(`  Translating to ${lang.name}...`);
        const translated = await translatePromo(promo, lang.name);
        translations[lang.code] = translated;
        console.log(`  ✅ ${lang.name} done`);
      } catch (error) {
        console.error(`  ❌ Error translating to ${lang.name}:`, error.message);
      }
    }
    
    // Save translations to MongoDB
    await collection.updateOne(
      { _id: promo._id },
      { $set: { translations: translations } }
    );
    
    console.log('✅ Translations saved for this promo.');
  }

  await client.close();
  console.log('All translations generated!');
}

run().catch(console.error);
