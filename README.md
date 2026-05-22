# FinSight

> RAG-powered financial document analyzer — upload a PDF, ask questions in plain English, get cited answers grounded in your document.

---

## Architecture

FinSight implements a full Retrieval-Augmented Generation (RAG) pipeline:

```
PDF Upload
   │
   ▼
pdfplumber Parser       — extracts raw text, page-by-page
   │
   ▼
Sliding Window Chunker  — splits text into 500-word chunks with 50-word overlap
   │
   ▼
sentence-transformers   — encodes each chunk into a 384-dim embedding vector
(all-MiniLM-L6-v2)
   │
   ▼
ChromaDB Vector Store   — persists embeddings, indexed by document collection
   │
   ▼
Semantic Retrieval      — embeds the user's question, fetches top-5 nearest chunks
   │
   ▼
Claude Haiku            — synthesizes an answer strictly from retrieved context
   │
   ▼
Cited Answer            — response includes page numbers of every source used
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| PDF Parsing | [pdfplumber](https://github.com/jsvine/pdfplumber) |
| Embeddings | [sentence-transformers](https://www.sbert.net/) · `all-MiniLM-L6-v2` |
| Vector Store | [ChromaDB](https://www.trychroma.com/) |
| Backend API | [Flask](https://flask.palletsprojects.com/) |
| LLM | [Anthropic Claude Haiku](https://www.anthropic.com/) (`claude-haiku-4-5`) |
| Frontend | [Next.js 15](https://nextjs.org/) · [Tailwind CSS](https://tailwindcss.com/) |
| Backend Hosting | [Render](https://render.com/) |
| Frontend Hosting | [Vercel](https://vercel.com/) |

---

## How RAG Works

- **Index** — your PDF is parsed and split into overlapping text chunks, then each chunk is converted into a numerical embedding vector that captures its meaning.
- **Store** — those vectors are saved in ChromaDB, a local vector database, so they can be searched instantly by semantic similarity rather than keyword matching.
- **Retrieve** — when you ask a question, it is embedded the same way, and the five most semantically similar chunks are fetched from the database.
- **Generate** — Claude Haiku receives only those retrieved chunks as context and writes an answer grounded strictly in your document, then cites the page numbers it drew from.

---

## Running Locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- An Anthropic API key

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Start the Flask server (http://localhost:5000)
python app.py
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000

# Start the dev server (http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), upload a financial PDF, and start asking questions.

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/upload` | `POST` | Upload a PDF; returns `collection_id` and chunk count |
| `/ask` | `POST` | Ask a question against an indexed document |

**Ask request body:**
```json
{
  "collection_id": "abc12345",
  "question": "What was the net revenue in Q3?"
}
```

**Ask response:**
```json
{
  "answer": "Net revenue in Q3 was $4.2 billion...",
  "pages_cited": [12, 13]
}
```
