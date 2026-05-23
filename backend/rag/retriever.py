import anthropic
import os
from .embedder import embed_query
from .vectorstore import query_collection

claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def answer_question(doc_id: str, question: str) -> dict:
    # 1. Embed the question
    query_embedding = embed_query(question)

    # 2. Retrieve top-5 relevant chunks
    results = query_collection(doc_id, query_embedding, n_results=5)
    
    chunks = results["documents"][0]
    pages = [m["page"] for m in results["metadatas"][0]]
    
    # 3. Build context for Claude
    context = "\n\n".join([
        f"[Page {pages[i]}]\n{chunks[i]}"
        for i in range(len(chunks))
    ])

    # 4. Generate answer
    prompt = f"""You are a financial document analyst. Answer the question using ONLY the provided document excerpts.
After your answer, list the exact page numbers you used as sources.

Document excerpts:
{context}

Question: {question}

Answer:"""

    response = claude.messages.create(
        model="claude-haiku-4-5",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}]
    )
    
    answer_text = response.content[0].text
    
    return {
        "answer": answer_text,
        "pages_cited": list(set(pages)),
    }