import os
import openai
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# def embed_texts(texts):
#     # new OpenAI 1.0+ syntax
#     response = openai.embeddings.create(
#         model="text-embedding-3-small",
#         input=texts
#     )
#     vectors = [item.embedding for item in response.data]
#     return vectors

def embed_texts(texts, batch_size=50):
    model = SentenceTransformer('all-mpnet-base-v2')
    embs = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    return embs.tolist()