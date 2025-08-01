import { getQueryResults } from './retrieve-documents.js';
import { Anthropic } from "@anthropic-ai/sdk";

// Specify the question ask
const QUESTION = "<Enter your question here>";

// Specify the search query parameters
const NUM_CANDIDATES = 40;
const EXACT = false;
const LIMIT = 5;

async function run() {
  try {
    const documents = await getQueryResults(QUESTION, NUM_CANDIDATES, EXACT, LIMIT);
    
    // Uncomment below line to print out retrieved documents
    // console.log('Retrieved documents: ', documents);

    // Create a prompt consisting of the question and context to pass to the LLM
    const prompt = `A text is split into several chunks and you are provided a subset of these chunks as context to answer the question at the end.
      Respond appropriately if the question cannot be feasibly answered without access to the full text.
      Acknowledge limitations when the context provided is incomplete or does not contain relevant information to answer the question.
      If you need to fill knowledge gaps using information outside of the context, clearly attribute it as such.
      Context: ${documents.map(doc => doc.text)}
      Question: ${QUESTION}`;

    // Substitute with your favorite LLM service provider as needed
    const anthropic = new Anthropic();
    const answer = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
    });
    console.log(answer.content[0].text);
  } catch (err) {
    console.log(err.stack);
  }
}
run().catch(console.dir);