# Semantic Recommendation Microservice

This project contains a Python FastAPI backend that builds a FAISS index from a products dataset and serves semantic recommendations, plus a minimal React frontend to demo the API.

See `data/products_sample.json` for a small sample dataset.

## Quickstart (backend)

1. Create virtualenv and activate:

```bash
python -m venv venv
source venv/bin/activate
```

2. Install requirements:

```bash
pip install -r requirements.txt
```

3. (Optional) copy .env.example to .env and set `OPENAI_API_KEY` if you want to use OpenAI embeddings and LLM.

4. Build the index (uses embedded sample or your dataset at `data/products.json`):

```bash
python scripts/build_index.py
```

5. Run the API:

```bash
uvicorn app.api:app --reload --port 8000
```

6. Test:

```bash
curl -X POST "http://localhost:8000/recommend" -H "Content-Type: application/json" -d '{"q":"Outfit for a beach vacation this summer", "top_k":6}'
```

## Frontend

The `frontend/` folder contains a minimal React app (Vite). To run locally:

```bash
cd frontend
npm install
npm run dev
```

Or build for production and serve from a static server:

```bash
cd frontend
npm run build
# serve dist/ with nginx or any static host
```

## Notes
- The project supports OpenAI-based embeddings (if `OPENAI_API_KEY` is set) or falls back to `sentence-transformers` local model.
- The dataset is **not** included except for a small sample. Place your full dataset at `data/products.json`.
