import voyageai
import os

_client = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY"))

def embed_chunks(chunks: list[dict]) -> list[dict]:
    texts = [c["text"] for c in chunks]
    result = _client.embed(texts, model="voyage-3")
    for i, chunk in enumerate(chunks):
        chunk["embedding"] = result.embeddings[i]
    return chunks

def embed_query(text: str) -> list[float]:
    result = _client.embed([text], model="voyage-3")
    return result.embeddings[0]
