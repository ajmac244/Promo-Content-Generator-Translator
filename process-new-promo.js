import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'promos';

async function extractFields(promoText) {
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
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error(`OpenAI API error: ${JSON.stringify(data)}`);
  }
  let content = data.choices[0].message.content;
  
  if (content.includes('```json')) {
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }
  
  return JSON.parse(content);
}

async function generateTemplate(promoData) {
  const prompt = `
Generate a Handlebars template for a promo banner using this structured data:

${JSON.stringify(promoData, null, 2)}

Requirements:
- Use {{headline}}, {{description}}, and {{cta}} as placeholders
- Create a modern, attractive banner design
- Include CSS classes for styling
- Make it responsive and mobile-friendly
- Use semantic HTML structure

Return only the Handlebars template, no markdown formatting.
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
        { role: 'system', content: 'You are a helpful assistant that generates Handlebars templates for promo banners.' },
        { role: 'user', content: prompt }
      ]
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

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
  
  if (content.includes('```json')) {
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }
  
  return JSON.parse(content);
}

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

async function findSimilarPromos(embedding, collection) {
  try {
    const similar = await collection.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: embedding,
          numCandidates: 100,
          limit: 3
        }
      },
      {
        $project: {
          headline: 1,
          description: 1,
          cta: 1,
          states: 1,
          promo_type: 1,
          bet_amount: 1,
          bonus_amount: 1,
          valid_dates: 1,
          terms: 1,
          type: 1,
          _id: 0
        }
      }
    ]).toArray();
    
    return similar;
  } catch (error) {
    console.log('⚠️ Vector search failed, returning empty results:', error.message);
    return [];
  }
}

async function processNewPromo(legalText) {
  console.log('Processing new promo...');
  
  try {
    // Step 1: Extract structured fields
    console.log('1. Extracting structured fields...');
    const structured = await extractFields(legalText);
    console.log('✅ Fields extracted:', structured.headline);
    
    // Step 2: Generate template
    console.log('2. Generating template...');
    const template = await generateTemplate(structured);
    console.log('✅ Template generated');
    
    // Step 3: Translate
    console.log('3. Translating to Spanish, French, Chinese...');
    const translations = {
      es: await translatePromo(structured, 'Spanish'),
      fr: await translatePromo(structured, 'French'),
      zh: await translatePromo(structured, 'Chinese')
    };
    console.log('✅ Translations complete');
    
    // Step 4: Generate embedding
    console.log('4. Generating embedding...');
    const embedding = await generateEmbedding(legalText);
    console.log('✅ Embedding generated');
    
    // Step 5: Store in Atlas
    console.log('5. Storing in Atlas...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    const result = await collection.insertOne({
      promoText: legalText,
      ...structured,
      template: template,
      translations: translations,
      embedding: embedding,
      insertedAt: new Date()
    });
    console.log('✅ Stored in Atlas');
    
    // Step 6: Find similar promos
    console.log('6. Finding similar promos...');
    let similar = await findSimilarPromos(embedding, collection);
    // Filter out the just-inserted promo
    similar = similar.filter(promo => !promo._id || promo._id.toString() !== result.insertedId.toString());
    // Deduplicate by headline
    const seen = new Set();
    similar = similar.filter(promo => {
      if (!promo.headline) return false;
      if (seen.has(promo.headline)) return false;
      seen.add(promo.headline);
      return true;
    });
    console.log('✅ Found', similar.length, 'similar promos');
    
    await client.close();
    
    return {
      structured,
      template,
      translations,
      similar,
      id: result.insertedId
    };
    
  } catch (error) {
    console.error('❌ Error processing promo:', error);
    throw error;
  }
}

// Test the function (commented out for server use)
// async function test() {
//   const testPromo = "Eligible players in California who place a minimum bet of $75 on any sporting event on August 15th, 2024, will receive a 30% payout boost on their winnings. This promotion is valid for bets placed between 12:00 AM PT and 11:59 PM PT on August 15th, 2024.";
//   
//   const result = await processNewPromo(testPromo);
//   console.log('\n🎉 Processing complete!');
//   console.log('Structured data:', result.structured);
//   console.log('Template preview:', result.template.substring(0, 100) + '...');
//   console.log('Similar promos found:', result.similar.length);
// }

// test().catch(console.error);

export { processNewPromo };
