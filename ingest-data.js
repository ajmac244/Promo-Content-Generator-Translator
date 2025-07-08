import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MongoClient } from 'mongodb';
import { getEmbeddings } from './get-embeddings.js';
import { getEncoding } from 'js-tiktoken';

// Specify the pdf file name
const PDF_FILE = `sample_pdf.pdf`;

// Specify the chunking params
const CHUNK_SIZE = 250;
const CHUNK_OVERLAP = 50;

// Counts number of tokens in a given string.
const encoding = getEncoding('gpt2');

export const getTokenCount = (text) => {
  return encoding.encode(text).length;
};

async function run() {
  const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);
  try {
    const loader = new PDFLoader(PDF_FILE);
    const data = await loader.load();
    // Chunk the text from the PDF
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
      lengthFunction: getTokenCount,
    });
    const docs = await textSplitter.splitDocuments(data);
    console.log(`Successfully chunked the PDF into ${docs.length} documents.`);
    // Connect to your Atlas cluster
    await client.connect();
    const db = client.db("rag_db");
    const collection = db.collection("test");
    console.log("Clearing your collection of any pre-existing data.");
    const deleteResult = await collection.deleteMany({});
    console.log("Deleted " + deleteResult.deletedCount + " documents");
    console.log("Generating embeddings and inserting documents...");
    const embeddings = await getEmbeddings(docs.map(doc => doc.pageContent));
    const insertDocuments = docs.map((doc, index) => ({
      _id: index,
      text: doc.pageContent,
      vector_embeddings: embeddings[index],
      page_number: doc.metadata.loc.pageNumber,
    }));
    // Continue processing documents if an error occurs during an operation
    const options = { ordered: false };
    // Insert documents with embeddings into Atlas
    const result = await collection.insertMany(insertDocuments, options);
    console.log("Count of documents inserted: " + result.insertedCount);
  } catch (err) {
    console.log(err.stack);
  }
  finally {
    await client.close();
  }
}
run().catch(console.dir);
