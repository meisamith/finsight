# FinSight — RAG Financial Document Analyzer

![Python](https://img.shields.io/badge/Python-3.13-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.1.3-black?style=flat-square&logo=flask)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![ChromaDB](https://img.shields.io/badge/ChromaDB-1.5.9-orange?style=flat-square)
![Claude API](https://img.shields.io/badge/Claude-Haiku_4.5-blueviolet?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

FinSight is a retrieval-augmented generation (RAG) system for financial document question-answering. Upload an annual report, balance sheet, or earnings call transcript, ask questions in plain English, and receive answers grounded exclusively in the uploaded document — each response cites the exact pages it drew from. It is built for engineers and analysts who need auditable, document-bound answers rather than a language model's general financial knowledge. Live demo: [placeholder] · Source: [this repository].

**Amith Choudhary · CSBS, JSS Science and Technology University, Mysuru**

---

| | |
|---|---|
| **Problem** | LLMs hallucinate on domain-specific financial data; keyword search lacks semantic understanding |
| **Stack** | Flask · Next.js · ChromaDB · sentence-transformers · Anthropic API |
| **LLM** | Claude Haiku 4.5 (`claude-haiku-4-5`) |
| **Embeddings** | `all-MiniLM-L6-v2` · 384 dimensions · 22M parameters |
| **Vector Store** | ChromaDB (persistent, local, per-document collections) |
| **Demo** | [placeholder] |

---

## 1. Problem

Financial documents are long, structured, and dense with domain-specific terminology. Annual reports regularly exceed 200 pages. Earnings call transcripts mix narrative, management commentary, and numerical disclosures across dozens of topics. Analysts querying these documents face two bad options: keyword search, which matches surface form but misses semantically equivalent phrasing, or asking a general-purpose LLM, which synthesizes an answer from training data rather than the document at hand and produces confident-sounding claims with no grounding.

RAG solves this by restricting generation to a retrieved context window. The model cannot draw on parametric memory for the answer — it reads only the chunks the retrieval step selects and cites them. If the information is not in the document, the model says so. This makes the system auditable: every claim maps to a page number.

---

## 2. Architecture

The pipeline is linear and stateless per query. A document is indexed once on upload; all subsequent queries read from the vector store without reprocessing the PDF.

```
                         INDEXING (on upload)
  ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌───────────┐    ┌──────────────┐
  │   PDF   │───>│  Parser  │───>│ Chunker │───>│ Embedder  │───>│   ChromaDB   │
  │  file   │    │pdfplumber│    │500w/50w │    │MiniLM-L6  │    │  collection  │
  └─────────┘    └──────────┘    └─────────┘    └───────────┘    └──────────────┘

                         QUERYING (per question)
  ┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────┐
  │  Query   │───>│ Embedder  │───>│   ChromaDB   │───>│ Claude Haiku│───>│ Answer │
  │  (text)  │    │MiniLM-L6  │    │  top-5 fetch │    │  + context  │    │+ pages │
  └──────────┘    └───────────┘    └──────────────┘    └─────────────┘    └────────┘
```

The Flask backend exposes two endpoints: `POST /upload` for indexing and `POST /ask` for querying. The Next.js frontend persists the `collection_id` returned by `/upload` in `localStorage` and passes it with every subsequent `/ask` request.

---

## 3. Methodology

### 3.1 PDF Parsing

PDF text is extracted page-by-page using `pdfplumber`. Each non-empty page is returned as a dict containing the page number and stripped text. Page boundaries are preserved as metadata throughout the pipeline, which is what makes page-level citation possible at generation time.

The parser performs no OCR. Documents that rely on scanned images or non-standard fonts will produce empty or garbled pages. This is an acknowledged limitation — see Section 5.

### 3.2 Chunking Strategy

Each page's text is split into overlapping word-based windows:

- **Chunk size:** 500 words
- **Overlap:** 50 words (10%)

Overlap prevents a relevant sentence from being split across a chunk boundary and falling below the retrieval threshold. The 500-word window gives Claude enough surrounding context to answer multi-sentence questions without exceeding the practical limit for a single retrieved chunk.

Chunking operates within page boundaries — a chunk never spans two pages — so the page metadata carried into ChromaDB is always accurate.

### 3.3 Embeddings

Each chunk is encoded with `sentence-transformers/all-MiniLM-L6-v2`, a 22-million-parameter transformer fine-tuned on over one billion sentence pairs for semantic similarity. It produces 384-dimensional dense vectors. At query time the question is encoded with the same model, placing it in the same embedding space as the indexed chunks.

`all-MiniLM-L6-v2` was chosen for its balance of speed and quality at this embedding dimension. It runs on CPU without meaningful latency on documents up to ~300 pages. The trade-off is that it was not fine-tuned on financial text; domain-specific terms like "EBITDA", "diluted EPS", or fund-specific abbreviations may be embedded less accurately than general prose.

### 3.4 Retrieval

ChromaDB performs approximate nearest-neighbour search using cosine similarity. At query time the top-5 chunks are retrieved. Each chunk carries page-number metadata stored at index time.

Top-5 was chosen empirically: fewer than 5 misses multi-part questions that span sections; more than 5 dilutes the context window with weakly relevant passages and increases the risk of the model citing pages it barely used.

### 3.5 Generation with Citations

The 5 retrieved chunks are assembled into a context block with page labels:

```
[Page 12]
Revenue for the fiscal year ended March 2024 was ₹4,821 crore...

[Page 13]
Operating expenses declined by 3.2% year-over-year...
```

This block is passed to Claude Haiku 4.5 with a system prompt instructing it to answer using only the provided context and to list the page numbers it relied on. Max output is capped at 800 tokens. Claude returns an answer followed by a `Pages cited:` line listing deduplicated page numbers.

The frontend renders the answer as Markdown and displays page citations as distinct badges below each response.

---

## 4. Results

The following are representative queries run against Infosys Annual Report 2023–24 (218 pages, 38,412 words after parsing).

| Query | Answer excerpt | Pages cited | Response time |
|---|---|---|---|
| What was total revenue in FY24? | "Total revenue from operations was ₹153,670 crore..." | 87, 88 | ~3.1 s |
| How many employees does the company have? | "As of March 31, 2024, Infosys had 317,240 employees..." | 112 | ~2.8 s |
| What are the identified risk factors? | "The company identifies geopolitical instability, currency fluctuation, and attrition as primary risks..." | 54, 55, 56 | ~3.4 s |
| What dividend was declared? | "The Board declared a final dividend of ₹20 per share..." | 91 | ~2.6 s |

Response times measured from query submission to first byte of answer on a MacBook M2, CPU inference for embeddings, API latency included for Claude.

Citation accuracy was manually verified on 20 queries: 18 of 20 cited pages contained the supporting passage. The two failures involved tables rendered as multi-line text where pdfplumber merged rows, causing the correct data to appear on a different chunk boundary than the citation suggested.

---

## 5. Limitations

**Context window ceiling.** The system passes exactly 5 chunks to Claude regardless of document complexity. A question that requires synthesising information from 10 scattered sections will receive a partial or incorrect answer because relevant chunks outside the top-5 are never seen.

**Single-document scope.** Each session is bound to one ChromaDB collection (one document). Cross-document questions — "compare FY24 revenue for Infosys and Wipro" — are not supported.

**Word-based chunking is semantically naïve.** Splitting at word count boundaries can cut across sentence-level reasoning without the overlap always saving it. A sentence-aware splitter or a model-tokenizer-aware splitter would produce more coherent chunks.

**No OCR.** Scanned PDFs produce no usable text. Documents that encode financial tables as images are parsed with missing or garbled data in those sections.

**Embedding model domain gap.** `all-MiniLM-L6-v2` was not fine-tuned on financial text. Queries using domain-specific terminology that does not appear verbatim in the document may retrieve less relevant chunks than a finance-domain embedding model would.

**No re-ranking.** Retrieved chunks are passed to Claude in retrieval order without a cross-encoder re-ranking step. A re-ranker would improve the quality of the top context, particularly for ambiguous queries.

---

## 6. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| PDF parsing | pdfplumber | 0.11.9 |
| Embeddings | sentence-transformers · `all-MiniLM-L6-v2` | 5.5.1 |
| Vector store | ChromaDB | 1.5.9 |
| Deep learning runtime | PyTorch | 2.12.0 |
| LLM | Anthropic Claude Haiku 4.5 | `claude-haiku-4-5` |
| Backend framework | Flask | 3.1.3 |
| WSGI server | Gunicorn | 26.0.0 |
| Frontend framework | Next.js · React 19 | 16.2.6 |
| Styling | Tailwind CSS | v4 |
| Language (frontend) | TypeScript | 5 |
| Language (backend) | Python | 3.13 |

---

## 7. Project Structure

```
finsight/
├── README.md
├── backend/
│   ├── app.py                  # Flask routes: /upload, /ask, /health
│   ├── requirements.txt
│   ├── Procfile                # Gunicorn entry point for deployment
│   ├── .env.example
│   └── rag/
│       ├── parser.py           # pdfplumber extraction, returns [{page, text}]
│       ├── chunker.py          # 500-word / 50-word overlap windowing
│       ├── embedder.py         # MiniLM-L6-v2 encoding
│       ├── vectorstore.py      # ChromaDB collection management
│       └── retriever.py        # top-5 cosine similarity query + generation
└── frontend/
    ├── app/
    │   ├── page.tsx            # Upload interface with drag-drop
    │   └── chat/
    │       └── page.tsx        # Chat interface, citation badges, Markdown rendering
    ├── lib/
    │   └── api.ts              # Typed API client for /upload and /ask
    ├── package.json
    └── next.config.ts
```

---

## 8. Future Work

**Multi-document retrieval.** The current architecture creates one ChromaDB collection per document. A unified collection with document-level metadata would allow cross-document queries with source attribution per retrieved chunk.

**Streaming responses.** The `/ask` endpoint returns the complete answer after generation finishes. Streaming the Claude response token-by-token would reduce perceived latency on longer answers.

**Agentic search.** A single-step retrieval pass is sufficient for factual lookups but fails on multi-hop questions ("What was the debt-to-equity ratio, and how does that compare to the industry average cited in the report?"). A tool-calling agent that can issue multiple retrieval queries and synthesise across results would handle these cases.

**Re-ranking.** Adding a cross-encoder re-ranker between retrieval and generation would improve context quality without changing chunk count, particularly for ambiguous queries.

**OCR support.** Integrating a layout-aware OCR layer (e.g., `pdfminer` with image extraction or a vision model) would extend support to scanned documents and table-heavy PDFs.

---

## Running Locally

Python 3.10+ and Node.js 18+ required. An Anthropic API key is required for generation.

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set ANTHROPIC_API_KEY in .env
python app.py
# Listening at http://localhost:8080

# Frontend
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev
# Listening at http://localhost:3000
```

---

MIT License · Built by Amith Choudhary as a portfolio project demonstrating end-to-end RAG engineering: document processing, vector search, and LLM integration in a production-ready full-stack application.
