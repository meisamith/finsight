# FinSight — Financial Document Analyzer

> Upload a financial PDF. Ask questions in plain English. Get answers with page citations — no hallucinations, no guessing.

---

## What it does

- Upload any financial PDF (annual reports, balance sheets, earnings calls) and ask questions about it in plain English
- Answers are pulled directly from your document, not from the model's general knowledge — every response cites the exact pages it used
- The whole pipeline runs end-to-end: parsing, indexing, retrieval, and generation — no third-party search or external data sources

---

## Tech Stack

| Layer | Technology |
|---|---|
| PDF Parsing | pdfplumber |
| Embeddings | sentence-transformers · `all-MiniLM-L6-v2` |
| Vector Store | ChromaDB |
| Backend | Flask |
| LLM | Claude Haiku (`claude-haiku-4-5`) |
| Frontend | Next.js 15 · Tailwind CSS |

---

## How RAG works

RAG stands for Retrieval-Augmented Generation. Here's what actually happens when you upload a PDF and ask a question:

1. **Parse** — the PDF is read page by page and converted to plain text using pdfplumber
2. **Chunk** — that text is split into overlapping 500-word segments so no sentence gets cut off at a boundary
3. **Embed** — each chunk is run through a small neural network that converts it into a list of numbers representing its meaning (a vector)
4. **Retrieve** — when you ask a question, it's converted to a vector the same way, then the 5 chunks whose vectors are closest to your question are pulled from the database
5. **Generate** — Claude Haiku reads only those 5 chunks and writes an answer from them, then tells you exactly which pages it drew from

The model never guesses. If the answer isn't in the document, it says so.

---

## Architecture

```
PDF → Parser → Chunker → Embedder → ChromaDB → Query → Claude → Answer with citations
```

---

## How to run locally

You'll need Python 3.10+, Node.js 18+, and an Anthropic API key.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
python app.py
# Running at http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
# Running at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000), upload a PDF, and start asking.

---

## Built by

Amith Choudhary — 3rd semester CSBS student, JSS Science and Technology University, Mysuru.

Built as a portfolio project to demonstrate end-to-end AI/ML engineering: document processing, vector search, and LLM integration in a production-ready full-stack application.
