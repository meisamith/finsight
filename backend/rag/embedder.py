import voyageai
import os

_client = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY"))

def embed_chunks(chunks: list[dict], batch_size: int = 8) -> list[dict]:
    texts = [c["text"] for c in chunks]
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        result = _client.embed(batch, model="voyage-3")
        embeddings.extend(result.embeddings)
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = embeddings[i]
    return chunks

def embed_query(text: str) -> list[float]:
    result = _client.embed([text], model="voyage-3")
    return result.embeddings[0]
