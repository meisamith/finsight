def chunk_pages(pages: list[dict], chunk_size: int = 500, overlap: int = 50) -> list[dict]:
    chunks = []
    chunk_id = 0

    for page in pages:
        words = page["text"].split()
        start = 0
        while start < len(words):
            end = start + chunk_size
            chunk_words = words[start:end]
            chunks.append({
                "chunk_id": chunk_id,
                "page": page["page"],
                "text": " ".join(chunk_words),
            })
            chunk_id += 1
            if end >= len(words):
                break
            start = end - overlap

    return chunks
