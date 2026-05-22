from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os, uuid
from rag.parser import extract_pages
from rag.embedder import embed_chunks
from rag.vectorstore import store_document
from rag.retriever import answer_question

load_dotenv()
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files["file"]
    doc_id = str(uuid.uuid4())[:8]
    path = os.path.join(UPLOAD_FOLDER, f"{doc_id}.pdf")
    file.save(path)
    
    pages = extract_pages(path)
    chunks = [{"chunk_id": f"{doc_id}_{i}", "text": p["text"], "page": p["page"]} for i, p in enumerate(pages)]
    chunks = embed_chunks(chunks)
    store_document(doc_id, chunks)

    return jsonify({
        "collection_id": doc_id,
        "chunks_indexed": len(chunks)
    })

@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    doc_id = data.get("collection_id")
    question = data.get("question")

    if not doc_id or not question:
        return jsonify({"error": "Missing collection_id or question"}), 400
    
    result = answer_question(doc_id, question)
    return jsonify(result)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/api/health", methods=["GET"])
def api_health():
    return jsonify({"status": "ok", "cors": "enabled"})

if __name__ == "__main__":
    app.run(debug=True, port=8080)