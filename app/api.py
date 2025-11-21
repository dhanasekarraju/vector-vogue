import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

from app.indexer import search, search_by_image

app = FastAPI(title="Vector Vogue", version="0.1")

# Add CORS middleware - THIS IS CRITICAL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],  # React/Vite dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    q: str | None = None
    image_base64: str | None = None
    top_k: int = 12
    rerank: bool = False
    gender_filter: str | None = None

@app.post("/api/recommend")
def recommend(query: Query):
    try:
        logger.info(f"Processing request - Text: {bool(query.q)}, Image: {bool(query.image_base64)}")

        # Validate input
        if not query.q and not query.image_base64:
            raise HTTPException(status_code=400, detail="Either query text or image must be provided")

        # --- IMAGE QUERY ---
        if query.image_base64:
            logger.info("Processing image-based search")

            # Validate base64 image
            if not query.image_base64.strip():
                raise HTTPException(status_code=400, detail="Empty image data")

            # Clean the base64 string (remove data URL prefix if present)
            image_data = query.image_base64
            if image_data.startswith('data:image'):
                try:
                    # Extract the actual base64 data after the comma
                    image_data = image_data.split(',')[1]
                    logger.info("Cleaned data URL prefix from image")
                except Exception as e:
                    logger.warning(f"Failed to clean data URL: {e}")
                    # Continue with original data

            logger.info(f"Image data length: {len(image_data)}")
            logger.info(f"Image data preview: {image_data[:100]}...")

            try:
                candidates = search_by_image(image_data, query.top_k, query.gender_filter)
                logger.info(f"Image search returned {len(candidates)} candidates")
            except Exception as e:
                logger.error(f"Image search failed: {str(e)}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

        # --- TEXT QUERY ---
        else:
            logger.info(f"Processing text search: '{query.q}'")
            if not query.q.strip():
                raise HTTPException(status_code=400, detail="Empty query text")

            candidates = search(query.q, query.top_k, gender_filter=query.gender_filter)
            logger.info(f"Text search returned {len(candidates)} candidates")

        # Handle no results
        if not candidates:
            return {
                "query": query.q,
                "results": [],
                "message": "No products found matching your criteria"
            }

        # Apply reranking if requested
        if query.rerank:
            try:
                from app.reranker import rerank_and_explain
                logger.info("Applying reranking...")
                reranked = rerank_and_explain(
                    query.q if query.q else "fashion item",
                    candidates,
                    max_results=query.top_k,
                )
                return {
                    "query": query.q,
                    "results": reranked,
                    "reranked": True
                }
            except Exception as e:
                logger.error(f"Reranking failed, returning original results: {e}")
                # Fallback to original results if reranking fails
                return {
                    "query": query.q,
                    "results": candidates[:query.top_k],
                    "reranked": False,
                    "warning": "Smart ranking unavailable, showing basic results"
                }

        return {
            "query": query.q,
            "results": candidates[:query.top_k],
            "reranked": False
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "Vector Vogue API", "status": "running"}