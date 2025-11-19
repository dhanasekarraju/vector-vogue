# app/reranker.py - FREE version
from sentence_transformers import CrossEncoder
import numpy as np

# Load free reranking model (downloads once, then runs locally)
model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def rerank_and_explain(query: str, candidates: list, max_results: int = 6):
    # Prepare text pairs for reranking
    pairs = []
    for candidate in candidates:
        raw = candidate.get("raw") or {}
        description = raw.get("description") or raw.get("product_description") or ""
        text = f"{candidate.get('title', '')} {description}"
        pairs.append([query, text])

    # Get reranking scores (free, local processing)
    scores = model.predict(pairs)

    # Combine with original candidates
    reranked = []
    for i, (score, candidate) in enumerate(zip(scores, candidates)):
        new_item = candidate.copy()
        new_item["llm_score"] = float(score)
        new_item["explanation"] = f"Relevance score: {score:.3f} based on semantic matching"
        new_item["rank"] = i + 1
        reranked.append(new_item)

    # Sort by rerank score
    reranked.sort(key=lambda x: x["llm_score"], reverse=True)

    return reranked[:max_results]