# app/reranker.py - ENHANCED PRECISION version
from sentence_transformers import CrossEncoder
import numpy as np
import re
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load free reranking model (downloads once, then runs locally)
_model = None

def get_model():
    global _model
    if _model is None:
        logger.info("Loading Cross-Encoder model...")
        try:
            # Load with fast tokenizer explicitly
            from transformers import AutoTokenizer

            # First load the tokenizer with use_fast=True
            tokenizer = AutoTokenizer.from_pretrained(
                'cross-encoder/ms-marco-MiniLM-L-6-v2',
                use_fast=True,
                local_files_only=False
            )

            # Then load the model with the fast tokenizer
            _model = CrossEncoder(
                'cross-encoder/ms-marco-MiniLM-L-6-v2',
                tokenizer=tokenizer
            )
            logger.info("Model loaded successfully with fast tokenizer!")

        except Exception as e:
            logger.warning(f"Failed to load with fast tokenizer, falling back: {e}")
            _model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            logger.info("Model loaded with default tokenizer")

    return _model

def extract_product_features(product):
    """Enhanced product feature extraction with sentiment analysis"""
    raw = product.get("raw") or {}

    # Title (most important) - with sentiment weighting
    title = product.get('title', '') or raw.get('title', '')
    title_sentiment = analyze_title_sentiment(title)

    # Enhanced features extraction
    features = raw.get('features', [])
    if features and isinstance(features, list):
        # Categorize features for better matching
        material_features = []
        style_features = []
        functional_features = []

        for feature in features[:8]:  # Increased limit
            feature_str = str(feature).lower()
            if any(word in feature_str for word in ['cotton', 'polyester', 'silk', 'wool', 'linen', 'fabric']):
                material_features.append(feature_str)
            elif any(word in feature_str for word in ['style', 'design', 'fit', 'fashion', 'look']):
                style_features.append(feature_str)
            else:
                functional_features.append(feature_str)

        features_text = " ".join(material_features + style_features + functional_features)
    else:
        features_text = ""

    # Smart description extraction
    description = raw.get('description') or raw.get('product_description') or ""
    if isinstance(description, list):
        # Take first 3 lines but prioritize lines with key information
        important_lines = []
        for line in description[:3]:
            line_str = str(line)
            if any(keyword in line_str.lower() for keyword in ['comfort', 'quality', 'perfect', 'ideal', 'great', 'excellent']):
                important_lines.insert(0, line_str)  # Prioritize
            else:
                important_lines.append(line_str)
        description = " ".join(important_lines)

    # Enhanced category analysis
    categories = raw.get('categories', [])
    category_context = ""
    if categories and isinstance(categories, list):
        main_category = categories[0] if categories else ""
        sub_categories = categories[1:4] if len(categories) > 1 else []
        category_context = f"{main_category} {' '.join(sub_categories)}"

    # Price intelligence
    price = product.get('price')
    price_context = ""
    if price:
        if price < 20:
            price_context = " budget affordable cheap"
        elif price < 50:
            price_context = " moderately priced value"
        elif price < 100:
            price_context = " premium quality"
        else:
            price_context = " luxury high-end expensive"

    # Rating intelligence
    rating = product.get('rating') or raw.get('average_rating')
    rating_context = ""
    if rating:
        if rating >= 4.5:
            rating_context = " highly rated excellent reviews"
        elif rating >= 4.0:
            rating_context = " well reviewed popular"
        elif rating >= 3.0:
            rating_context = " decent ratings"

    # Brand extraction for brand-aware matching
    brand = product.get('brand') or raw.get('brand') or ""
    brand_context = f" {brand}" if brand else ""

    # Combine with intelligent weighting
    combined_text = (
        f"{title}{title_sentiment}. {features_text}. "
        f"{category_context}. {description}"
        f"{price_context}{rating_context}{brand_context}"
    )

    # Advanced cleaning
    combined_text = re.sub(r'[^\w\s\.]', ' ', combined_text)  # Keep periods
    combined_text = re.sub(r'\s+', ' ', combined_text).strip()

    return combined_text

def analyze_title_sentiment(title):
    """Analyze title for positive/descriptive words that boost relevance"""
    positive_indicators = [
        'best', 'perfect', 'ideal', 'great', 'excellent', 'premium',
        'quality', 'comfortable', 'stylish', 'fashion', 'elegant',
        'beautiful', 'amazing', 'wonderful', 'superb'
    ]

    title_lower = title.lower()
    sentiment_words = [word for word in positive_indicators if word in title_lower]

    if sentiment_words:
        return " " + " ".join(sentiment_words)
    return ""

def analyze_query_intent(query):
    """Enhanced query intent analysis with pattern matching"""
    query_lower = query.lower().strip()

    intent = {
        'is_gender_specific': False,
        'gender': None,
        'is_occasion_based': False,
        'occasion': None,
        'is_seasonal': False,
        'season': None,
        'is_price_sensitive': False,
        'price_range': None,
        'is_rating_sensitive': False,
        'is_brand_specific': False,
        'brands': [],
        'is_color_specific': False,
        'colors': [],
        'is_style_specific': False,
        'styles': [],
        'query_complexity': 'simple'
    }

    # Enhanced gender detection with patterns
    gender_patterns = {
        'men': r'\b(men|men\'s|mens|male|boy|boys|guy|guys|gentlemen)\b',
        'women': r'\b(women|women\'s|womens|female|girl|girls|lady|ladies)\b',
        'unisex': r'\b(unisex|both|all)\b'
    }

    for gender, pattern in gender_patterns.items():
        if re.search(pattern, query_lower):
            intent['is_gender_specific'] = True
            intent['gender'] = gender
            break

    # Enhanced occasion detection
    occasions = {
        'beach': ['beach', 'swim', 'pool', 'vacation', 'resort', 'tropical'],
        'wedding': ['wedding', 'bridal', 'formal', 'ceremony', 'reception'],
        'office': ['office', 'work', 'professional', 'business', 'corporate'],
        'sports': ['sports', 'gym', 'workout', 'running', 'exercise', 'athletic'],
        'casual': ['casual', 'everyday', 'comfort', 'relaxed', 'lounge'],
        'party': ['party', 'nightclub', 'evening', 'celebration'],
        'travel': ['travel', 'airport', 'flight', 'journey']
    }

    for occasion, terms in occasions.items():
        if any(term in query_lower for term in terms):
            intent['is_occasion_based'] = True
            intent['occasion'] = occasion
            break

    # Enhanced seasonal detection
    seasons = {
        'summer': ['summer', 'hot', 'warm', 'sunny', 'heat'],
        'winter': ['winter', 'cold', 'snow', 'freezing', 'chilly'],
        'spring': ['spring', 'blossom', 'fresh', 'light'],
        'fall': ['fall', 'autumn', 'cool', 'crisp']
    }

    for season, terms in seasons.items():
        if any(term in query_lower for term in terms):
            intent['is_seasonal'] = True
            intent['season'] = season
            break

    # Price sensitivity with range detection
    price_terms = {
        'budget': ['cheap', 'budget', 'affordable', 'inexpensive', 'low cost'],
        'premium': ['expensive', 'luxury', 'premium', 'high end', 'designer']
    }

    for range_type, terms in price_terms.items():
        if any(term in query_lower for term in terms):
            intent['is_price_sensitive'] = True
            intent['price_range'] = range_type
            break

    # Rating sensitivity
    rating_terms = ['rated', 'rating', 'stars', 'review', 'popular', 'best selling']
    intent['is_rating_sensitive'] = any(term in query_lower for term in rating_terms)

    # Brand detection
    common_brands = ['nike', 'adidas', 'zara', 'h&m', 'levi', 'gucci', 'prada']
    detected_brands = [brand for brand in common_brands if brand in query_lower]
    if detected_brands:
        intent['is_brand_specific'] = True
        intent['brands'] = detected_brands

    # Color detection
    colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple']
    detected_colors = [color for color in colors if color in query_lower]
    if detected_colors:
        intent['is_color_specific'] = True
        intent['colors'] = detected_colors

    # Style detection
    styles = ['vintage', 'modern', 'classic', 'trendy', 'bohemian', 'minimalist']
    detected_styles = [style for style in styles if style in query_lower]
    if detected_styles:
        intent['is_style_specific'] = True
        intent['styles'] = detected_styles

    # Query complexity analysis
    word_count = len(query.split())
    if word_count > 4 or (intent['is_gender_specific'] and intent['is_occasion_based']):
        intent['query_complexity'] = 'complex'
    elif word_count > 2:
        intent['query_complexity'] = 'medium'

    return intent

def generate_smart_explanation(query, product, score, intent):
    """Generate intelligent, contextual explanations"""
    title = product.get('title', '')
    price = product.get('price')
    rating = product.get('rating')
    brand = product.get('brand', '')

    explanations = []
    confidence_phrases = []

    # Score-based confidence
    if score > 0.85:
        confidence_phrases.extend(["excellent match", "perfect fit", "highly relevant"])
    elif score > 0.7:
        confidence_phrases.extend(["great match", "very relevant", "well suited"])
    elif score > 0.5:
        confidence_phrases.extend(["good match", "relevant", "suitable"])
    else:
        confidence_phrases.extend(["somewhat relevant", "partial match"])

    main_phrase = confidence_phrases[0]
    explanations.append(f"This is an {main_phrase} for '{query}'")

    # Enhanced gender matching
    if intent['is_gender_specific']:
        title_lower = title.lower()
        if intent['gender'] == 'men' and any(word in title_lower for word in ['men', 'men\'s', 'male', 'boy']):
            explanations.append("specifically designed for men")
        elif intent['gender'] == 'women' and any(word in title_lower for word in ['women', 'women\'s', 'female', 'girl']):
            explanations.append("specifically designed for women")
        elif intent['gender'] == 'unisex':
            explanations.append("suitable for all genders")

    # Enhanced occasion matching
    if intent['is_occasion_based']:
        occasion_keywords = {
            'beach': ['beach', 'swim', 'summer', 'vacation', 'tropical'],
            'wedding': ['wedding', 'formal', 'elegant', 'dress', 'bridal'],
            'office': ['office', 'professional', 'business', 'work', 'corporate'],
            'sports': ['sports', 'athletic', 'gym', 'running', 'training'],
            'casual': ['casual', 'everyday', 'comfort', 'relaxed'],
            'party': ['party', 'evening', 'night', 'celebration'],
            'travel': ['travel', 'comfort', 'airport', 'journey']
        }

        title_lower = title.lower()
        matched = False
        for keyword in occasion_keywords.get(intent['occasion'], []):
            if keyword in title_lower:
                explanations.append(f"ideal for {intent['occasion']} occasions")
                matched = True
                break

        if not matched and intent['occasion']:
            explanations.append(f"appropriate for {intent['occasion']} settings")

    # Color matching
    if intent['is_color_specific'] and intent['colors']:
        title_lower = title.lower()
        matched_colors = [color for color in intent['colors'] if color in title_lower]
        if matched_colors:
            explanations.append(f"available in {', '.join(matched_colors)}")

    # Brand matching
    if intent['is_brand_specific'] and brand:
        explanations.append(f"from {brand} brand")

    # Price intelligence
    if price:
        if intent['is_price_sensitive']:
            if intent['price_range'] == 'budget' and price < 30:
                explanations.append("fits your budget needs")
            elif intent['price_range'] == 'premium' and price > 80:
                explanations.append("matches your premium preference")

        # General price context
        if price < 25:
            explanations.append("budget-friendly pricing")
        elif price > 100:
            explanations.append("premium quality investment")

    # Rating intelligence
    if rating:
        if intent['is_rating_sensitive'] and rating >= 4.0:
            explanations.append("highly rated by customers")
        elif rating >= 4.5:
            explanations.append("excellent customer ratings")
        elif rating >= 4.0:
            explanations.append("well reviewed by users")

    # Style matching
    if intent['is_style_specific'] and intent['styles']:
        title_lower = title.lower()
        matched_styles = [style for style in intent['styles'] if style in title_lower]
        if matched_styles:
            explanations.append(f"{matched_styles[0]} style as requested")

    # Combine explanations intelligently
    if len(explanations) > 1:
        base = explanations[0]
        reasons = ", ".join(explanations[1:3])  # Limit to top 2 reasons
        explanation = f"{base} because it {reasons}"
    else:
        explanation = explanations[0]

    return f"{explanation} (confidence: {score:.3f})"

def apply_business_rules(results, intent):
    """Enhanced business rules with smart boosting and filtering"""
    filtered_results = []

    for result in results:
        score = result.get("llm_score", 0)
        original_score = score

        # Skip obvious mismatches
        if should_filter_product(result, intent):
            continue

        # Apply boosts for good matches
        score = apply_relevance_boosts(score, result, intent)

        # Update score if changed
        if score != original_score:
            result["llm_score"] = score
            result["score_boost"] = f"boosted from {original_score:.3f}"

        filtered_results.append(result)

    return filtered_results

def should_filter_product(product, intent):
    """Determine if product should be filtered out"""
    title_lower = product.get('title', '').lower()

    # Strict gender filtering
    if intent['is_gender_specific']:
        if intent['gender'] == 'men' and any(word in title_lower for word in ['women', 'women\'s', 'female', 'girl']):
            return True
        elif intent['gender'] == 'women' and any(word in title_lower for word in ['men', 'men\'s', 'male', 'boy']):
            return True

    # Price range filtering for explicit requests
    if intent['is_price_sensitive'] and intent['price_range']:
        price = product.get('price', 0)
        if intent['price_range'] == 'budget' and price > 50:
            return True
        elif intent['price_range'] == 'premium' and price < 30:
            return True

    return False

def apply_relevance_boosts(score, product, intent):
    """Apply intelligent score boosts for better matches"""
    title_lower = product.get('title', '').lower()
    price = product.get('price', 0)
    rating = product.get('rating', 0)

    # Gender match boost
    if intent['is_gender_specific']:
        if intent['gender'] == 'men' and any(word in title_lower for word in ['men', 'men\'s', 'male']):
            score *= 1.15
        elif intent['gender'] == 'women' and any(word in title_lower for word in ['women', 'women\'s', 'female']):
            score *= 1.15

    # High rating boost for rating-sensitive queries
    if intent['is_rating_sensitive'] and rating >= 4.0:
        score *= 1.10

    # Brand match boost
    if intent['is_brand_specific'] and intent['brands']:
        brand = product.get('brand', '').lower()
        if any(req_brand in brand for req_brand in intent['brands']):
            score *= 1.12

    # Color match boost
    if intent['is_color_specific'] and intent['colors']:
        if any(color in title_lower for color in intent['colors']):
            score *= 1.08

    return min(score, 1.0)  # Cap at 1.0

def rerank_and_explain(query: str, candidates: list, max_results: int = 6):
    """Enhanced reranking with intelligent explanations and caching"""

    if not candidates:
        return []

    logger.info(f"Reranking {len(candidates)} candidates for query: '{query}'")

    # Analyze query intent
    intent = analyze_query_intent(query)
    logger.info(f"Detected intent: {intent}")

    # Prepare enhanced text pairs for reranking
    pairs = []
    product_contexts = []

    for candidate in candidates:
        # Extract rich product context
        product_text = extract_product_features(candidate)
        pairs.append([query, product_text])
        product_contexts.append(candidate)

    # Get reranking scores
    model = get_model()
    scores = model.predict(pairs)

    # Combine with original candidates and generate explanations
    reranked = []
    for i, (score, candidate) in enumerate(zip(scores, product_contexts)):
        new_item = candidate.copy()
        new_item["llm_score"] = float(score)
        new_item["explanation"] = generate_smart_explanation(query, candidate, score, intent)
        new_item["rank"] = i + 1
        reranked.append(new_item)

    # Sort by rerank score
    reranked.sort(key=lambda x: x["llm_score"], reverse=True)

    # Apply additional business logic filters
    final_results = apply_business_rules(reranked, intent)

    logger.info(f"Reranking complete. Returning {len(final_results[:max_results])} results")
    return final_results[:max_results]

# New: Batch processing for efficiency
def batch_rerank(queries_candidates: List[tuple], max_results: int = 6):
    """Process multiple queries in batch for efficiency"""
    all_results = []

    for query, candidates in queries_candidates:
        results = rerank_and_explain(query, candidates, max_results)
        all_results.append({
            'query': query,
            'results': results,
            'result_count': len(results)
        })

    return all_results

# New: Performance monitoring
class RerankPerformance:
    def __init__(self):
        self.stats = {
            'total_queries': 0,
            'avg_candidates': 0,
            'avg_processing_time': 0
        }

    def log_rerank_operation(self, query, candidate_count, processing_time):
        self.stats['total_queries'] += 1
        self.stats['avg_candidates'] = (
                (self.stats['avg_candidates'] * (self.stats['total_queries'] - 1) + candidate_count)
                / self.stats['total_queries']
        )
        self.stats['avg_processing_time'] = (
                (self.stats['avg_processing_time'] * (self.stats['total_queries'] - 1) + processing_time)
                / self.stats['total_queries']
        )

# Global performance tracker
performance_tracker = RerankPerformance()