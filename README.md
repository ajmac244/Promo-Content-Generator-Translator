# Promo Content Generator & Translator

A Node.js app for betting & gaming companies that uses **OpenAI** to extract structured data from legal promo text, generate Handlebars templates for banners/widgets, translate content into multiple languages, and find similar promos with **MongoDB Atlas Vector Search**. Includes a simple web UI for demo and experimentation.

**Tech Stack:** Node.js, Express, OpenAI API, **MongoDB Atlas (Vector Search)**, Handlebars, HTML/CSS/JS

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your own keys:

```
OPENAI_API_KEY=your-openai-key-here
MONGODB_URI=your-mongodb-uri-here
```

---

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **(Optional) Populate with mock data:**
   ```sh
   npm run populate-mock
   ```
3. **Start the server:**
   ```sh
   node chatbot-server.js
   ```
4. **Open the UI:**  
   Go to [http://localhost:3001](http://localhost:3001) in your browser.

---

## Notes

- This project uses **OpenAI** for all AI features (extraction, template generation, translation, embeddings).
- **MongoDB Atlas** is used for storage and vector search.
- No Anthropic or Voyage integration is included.

---

## License

MIT
