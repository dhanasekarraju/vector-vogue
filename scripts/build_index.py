#!/usr/bin/env python3
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import numpy as np
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from app.embeddings import embed_texts

DATA_PATH = os.getenv("DATA_PATH", "data/products.json")
INDEX_PATH = os.getenv("INDEX_PATH", "data/faiss.index")
META_PATH = os.getenv("META_PATH", "data/meta.json")

def doc_text(product):
    parts = []
    for k in ("title", "features", "categories", "description", "product_description"):
        v = product.get(k)
        if not v: continue
        if isinstance(v, list):
            parts.append(" . ".join([str(x) for x in v if x]))
        else:
            parts.append(str(v))
    price = product.get("price")
    if price:
        parts.append(f"price: {price}")
    rating = product.get("average_rating")
    if rating:
        parts.append(f"rating: {rating}")
    return " . ".join(parts)

def load_products(path):
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"dataset not found at {path.resolve()}")

    with open(path, 'r', encoding='utf-8') as f:
        raw = f.read().strip()
        if raw.startswith("["):
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                pass  # fallback to line-by-line
        products = []
        for i, line in enumerate(raw.splitlines(), 1):
            if not line.strip(): continue
            try:
                products.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return products

def main():
    print("Loading products...")
    products = load_products(DATA_PATH)
    print(f"Loaded {len(products)} products")
    texts = [doc_text(p) for p in products]

    print("Creating embeddings (this may take time)...")
    vectors = embed_texts(texts)
    arr = np.array(vectors).astype('float32')
    dim = arr.shape[1]
    print(f"Embedding dim: {dim}")

    import faiss
    faiss.normalize_L2(arr)
    index = faiss.IndexFlatIP(dim)
    index.add(arr)
    faiss.write_index(index, INDEX_PATH)
    print(f"Wrote index to {INDEX_PATH}")

    meta = [{"idx": i, "parent_asin": p.get("parent_asin"), "title": p.get("title"),
             "price": p.get("price"), "rating": p.get("average_rating"), "raw": p}
            for i, p in enumerate(products)]
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"Wrote metadata to {META_PATH}")

if __name__ == "__main__":
    main()
