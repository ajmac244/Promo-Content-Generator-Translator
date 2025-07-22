import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

const MONGODB_URI = process.env.MONGODB_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'promos';

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

async function run() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  // Get all promos that have structured data but no template
  const promos = await collection.find({ 
    headline: { $exists: true },
    template: { $exists: false }
  }).toArray();

  console.log(`Found ${promos.length} promos to generate templates for.`);

  for (const promo of promos) {
    console.log('Generating template for:', promo.headline);
    
    try {
      const template = await generateTemplate(promo);
      
      await collection.updateOne(
        { _id: promo._id },
        { $set: { template: template } }
      );
      
      console.log('✅ Template generated and saved.');
    } catch (error) {
      console.error('❌ Error generating template:', error.message);
    }
  }

  await client.close();
  console.log('All templates generated!');
}

run().catch(console.error);
