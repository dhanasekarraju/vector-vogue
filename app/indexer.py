import faiss
import numpy as np
import json
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

INDEX_PATH = Path("data/faiss.index")
META_PATH = Path("data/meta.json")

if not INDEX_PATH.exists() or not META_PATH.exists():
    raise FileNotFoundError("FAISS index or metadata not found. Run build_index.py first.")

index = faiss.read_index(str(INDEX_PATH))
with open(META_PATH, "r", encoding="utf-8") as f:
    meta = json.load(f)

def search(query_text, top_k=6):
    from app.embeddings import embed_texts
    vec = embed_texts([query_text])[0]
    vec = np.array(vec).astype('float32')
    faiss.normalize_L2(vec.reshape(1, -1))
    D, I = index.search(vec.reshape(1, -1), top_k)
    results = []
    for score, idx in zip(D[0], I[0]):
        item = meta[idx].copy()
        item["score"] = float(score)
        results.append(item)
    return results
