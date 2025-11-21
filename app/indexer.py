import faiss
import numpy as np
import json
from pathlib import Path
from dotenv import load_dotenv
import logging

# Configure logging
logger = logging.getLogger(__name__)
load_dotenv()

INDEX_PATH = Path("data/faiss.index")
META_PATH = Path("data/meta.json")

if not INDEX_PATH.exists() or not META_PATH.exists():
    raise FileNotFoundError("FAISS index or metadata not found. Run build_index.py first.")

index = faiss.read_index(str(INDEX_PATH))
with open(META_PATH, "r", encoding="utf-8") as f:
    meta = json.load(f)

# Get the dimension of the FAISS index
index_dimension = index.d
logger.info(f"FAISS index dimension: {index_dimension}")

def detect_gender_from_query(query):
    """Detect gender intent from query"""
    query_lower = query.lower()

    male_keywords = ['men', 'men\'s', 'mens', 'male', 'boy', 'boys', 'guy', 'guys', 'man']
    female_keywords = ['women', 'women\'s', 'womens', 'female', 'girl', 'girls', 'lady', 'ladies', 'woman']

    male_score = sum(1 for word in male_keywords if word in query_lower)
    female_score = sum(1 for word in female_keywords if word in query_lower)

    if male_score > female_score:
        return 'men'
    elif female_score > male_score:
        return 'women'
    else:
        return None

def filter_by_gender(results, target_gender):
    """Filter results by gender"""
    if not target_gender:
        return results

    filtered = []
    male_keywords = ['men', 'men\'s', 'mens', 'male', 'boy', 'boys', 'guy', 'guys', 'man']
    female_keywords = ['women', 'women\'s', 'womens', 'female', 'girl', 'girls', 'lady', 'ladies', 'woman']

    for result in results:
        title = result.get('title', '').lower()

        if target_gender == 'men':
            # Include if has male keywords AND no female keywords
            has_male = any(word in title for word in male_keywords)
            has_female = any(word in title for word in female_keywords)
            if has_male and not has_female:
                filtered.append(result)
        elif target_gender == 'women':
            # Include if has female keywords AND no male keywords
            has_female = any(word in title for word in female_keywords)
            has_male = any(word in title for word in male_keywords)
            if has_female and not has_male:
                filtered.append(result)

    return filtered

def search(query_text, top_k=6, gender_filter=None):
    from app.embeddings import embed_texts

    # Get more results initially for filtering
    search_k = top_k * 3

    # Semantic search
    vec = embed_texts([query_text])[0]
    vec = np.array(vec).astype('float32')
    faiss.normalize_L2(vec.reshape(1, -1))
    D, I = index.search(vec.reshape(1, -1), search_k)

    # Get initial results
    initial_results = []
    for score, idx in zip(D[0], I[0]):
        item = meta[idx].copy()
        item["score"] = float(score)
        initial_results.append(item)

    # Auto-detect gender from query if not specified
    if gender_filter is None:
        gender_filter = detect_gender_from_query(query_text)

    # Apply gender filtering
    if gender_filter:
        filtered_results = filter_by_gender(initial_results, gender_filter)
        # If filtering removed too many results, fall back to some unfiltered
        if len(filtered_results) < top_k:
            # Mix filtered and some high-score unfiltered results
            filtered_results.extend([r for r in initial_results if r not in filtered_results])
    else:
        filtered_results = initial_results

    return filtered_results[:top_k]

# Optional: Separate function with explicit gender control
def search_with_gender(query_text, top_k=6, gender=None):
    """
    Search with explicit gender control

    Args:
        query_text: Search query
        top_k: Number of results
        gender: 'men', 'women', or None for auto-detect
    """
    return search(query_text, top_k, gender_filter=gender)

def search_by_image(base64_img, top_k=6, gender_filter=None):
    """
    Enhanced solution: Use image captioning to convert image to text,
    then use text search
    """
    try:
        logger.info(f"Using image captioning for image search")

        # Generate text description from image
        image_description = generate_image_description(base64_img)
        logger.info(f"Generated image description: {image_description}")

        # Use the generated description for text search
        from app.indexer import search
        results = search(image_description, top_k * 2, gender_filter)

        logger.info(f"Found {len(results)} results using image description")

        return results[:top_k]

    except Exception as e:
        logger.error(f"Image search failed: {e}")
        # Fallback to generic search
        logger.info("Falling back to generic search")
        return search_by_image_fallback(top_k, gender_filter)

def generate_image_description(base64_img):
    """
    Use a pre-trained image captioning model to generate text description
    """
    try:
        from transformers import BlipProcessor, BlipForConditionalGeneration
        from PIL import Image
        import base64
        from io import BytesIO

        # Load model (this will download on first run)
        processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

        # Decode base64 image
        if base64_img.startswith('data:image'):
            base64_img = base64_img.split(',')[1]

        img_bytes = base64.b64decode(base64_img)
        image = Image.open(BytesIO(img_bytes)).convert('RGB')

        # Generate caption
        inputs = processor(image, return_tensors="pt")
        out = model.generate(**inputs, max_length=50, num_beams=5)
        caption = processor.decode(out[0], skip_special_tokens=True)

        return caption

    except Exception as e:
        logger.warning(f"Image captioning failed: {e}")
        # Fallback descriptions based on common fashion items
        fallback_descriptions = [
            "fashion clothing style",
            "apparel outfit wear",
            "clothing fashion items"
        ]
        import random
        return random.choice(fallback_descriptions)

def search_by_image_fallback(top_k=6, gender_filter=None):
    """Fallback image search using generic fashion queries"""
    from app.indexer import search

    generic_queries = [
        "fashion clothing style",
        "apparel outfit trendy",
        "clothing wear fashion"
    ]

    all_results = []
    for query in generic_queries:
        results = search(query, top_k, gender_filter)
        all_results.extend(results)

    # Remove duplicates
    seen = set()
    unique_results = []
    for result in all_results:
        result_id = result.get('asin') or result.get('id') or str(result)
        if result_id not in seen:
            seen.add(result_id)
            unique_results.append(result)

    unique_results.sort(key=lambda x: x.get('score', 0), reverse=True)
    return unique_results[:top_k]