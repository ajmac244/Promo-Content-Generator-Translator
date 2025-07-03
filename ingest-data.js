import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MongoClient } from 'mongodb';
import { getEmbedding } from './get-embeddings.js';

// Specify the pdf file name
const PDF_FILE = `oldmansea.pdf`;

// Specify the chunking params
const CHUNK_SIZE = 250;
const CHUNK_OVERLAP = 50;

// Specify the voyage embedding model
const EMBEDDING_MODEL = "voyage-3-large";

async function run() {
  const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);
  try {
    const loader = new PDFLoader(PDF_FILE);
    const data = await loader.load();
    // Chunk the text from the PDF
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
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
    const insertDocuments = [];
    await Promise.all(docs.map(async (doc, index) => {
      // Generate embeddings using the function that you defined
      const embedding = await getEmbedding(doc.pageContent, EMBEDDING_MODEL);
      // Add the document with the embedding to array of documents for bulk insert
      insertDocuments.push({
        _id: index,
        text: doc.pageContent,
        vector_embeddings: embedding,
        page_number: doc.metadata.loc.pageNumber,
      });
    }))
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
