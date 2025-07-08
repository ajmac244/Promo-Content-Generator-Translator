# atlas-search-playground-chatbot-starter

This Node.js project contains scripts you can run or refer to as starter code for your chatbot application.

## Prerequisites

- A terminal and code editor to run your Node.js project.
- npm and Node.js installed. https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- Log in or create a free Atlas account. https://account.mongodb.com/account/register?tck=docs_atlas
- If you don't have an Atlas cluster, create a free M0 cluster. https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23clusters%2Fedit%3Ffrom%3DctaClusterHeader
- Get your MongoDB Atlas connection string by clicking the “Connect” button on your cluster in the Atlas UI. https://www.mongodb.com/docs/manual/reference/connection-string/#find-your-mongodb-atlas-connection-string
- A Voyage AI API key. https://docs.voyageai.com/docs/api-key-and-installation
- An Anthropic API key. https://docs.anthropic.com/en/api/admin-api/apikeys/get-api-key

## Procedure

### 1. Clone the repo

Create a copy of the repository on your machine.

### 2. Set up the environment

#### a. Install dependencies.

Run the following npm command
```shell
npm install
```

#### b. Update the values in the `.env` file.

Fill in the API keys for Voyage AI and Anthropic.

Your connection string should use the following format:

```shell
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

### 3. Create the database and collection and populate it with the data from your PDF

#### a. Copy your PDF into the directory.

#### b. Open `ingest-data.js` and replace values for `PDF_FILE`, `CHUNK_SIZE`, `CHUNK_OVERLAP` as required.

#### c. Run the following command.

```shell
node --env-file=.env ingest-data.js
```

### 4. Create the vector index

Run the following command to create the vector index in Atlas.

```shell
node --env-file=.env build-vector-index.js
```

### 5. Ask a question, retrieve vector search results, and get a response from the chatbot

#### a. Open `generate-response.js` and replace values for `QUESTION`, `NUM_CANDIDATES`, `EXACT`, `LIMIT` as required.

#### b. Run the following command.

```shell
node --env-file=.env generate-response.js
```

#### c. Repeat the current step if you want to ask a new question or change search query parameters.

#### d. Repeat step 3 if you want to change the data or data settings for the chatbot to answer from.
