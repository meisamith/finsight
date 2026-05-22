import chromadb

client = chromadb.PersistentClient(path="./chroma_db")

def store_document(doc_id: str, chunks: list[dict]):
    collection = client.get_or_create_collection(name=doc_id)
    collection.add(
        ids=[c["chunk_id"] for c in chunks],
        embeddings=[c["embedding"] for c in chunks],
        documents=[c["text"] for c in chunks],
        metadatas=[{"page": c["page"]} for c in chunks]
    )

def query_collection(doc_id: str, query_embedding: list, n_results: int = 5):
    collection = client.get_collection(name=doc_id)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    return results