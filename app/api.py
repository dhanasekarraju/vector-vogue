import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
from app.indexer import search

app = FastAPI(title="Semantic Recommender", version="0.1")

class Query(BaseModel):
    q: str
    top_k: int = 6
    rerank: bool = False

# @app.post("/api/recommend")
# def recommend(query: Query):
#     try:
#         candidates = search(query.q, query.top_k)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     if query.rerank:
#         try:
#             from app.reranker import rerank_and_explain
#             reranked = rerank_and_explain(query.q, candidates, max_results=query.top_k)
#             return {"query": query.q, "results": reranked}
#         except Exception as e:
#             return {"query": query.q, "warning": f"rerank failed: {e}", "results": candidates}
#     return {"query": query.q, "results": candidates}

@app.post("/api/recommend")
def recommend(query: Query):
    try:
        candidates = search(query.q, query.top_k)
        print(f"[DEBUG] candidates={candidates[:3]}")  # show first 3 results
    except Exception as e:
        print(f"[ERROR] search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    if query.rerank:
        try:
            from app.reranker import rerank_and_explain
            reranked = rerank_and_explain(query.q, candidates, max_results=query.top_k)
            return {"query": query.q, "results": reranked}
        except Exception as e:
            print(f"[WARNING] rerank failed: {e}")
            return {"query": query.q, "warning": f"rerank failed: {e}", "results": candidates}

    return {"query": query.q, "results": candidates}

@app.get("/health")
def health():
    return {"status": "ok"}
