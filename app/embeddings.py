import logging
import threading
import time
import traceback
from functools import lru_cache
from typing import List

import faiss
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from PIL import Image
import base64
from io import BytesIO

# Configure logging
logger = logging.getLogger(__name__)
load_dotenv()


class EnhancedSentenceTransformer:
    """Enhanced embedding model with performance optimizations"""

    _model = None
    _model_lock = threading.Lock()
    _model_name = 'all-mpnet-base-v2'  # 768 dimensions for better quality

    @classmethod
    def get_model(cls):
        """Thread-safe model loading with singleton pattern"""
        if cls._model is None:
            with cls._model_lock:
                if cls._model is None:  # Double-check locking
                    logger.info(f"Loading SentenceTransformer model: {cls._model_name}")
                    start_time = time.time()

                    # Model configuration for optimal performance with fast tokenizer
                    cls._model = SentenceTransformer(
                        cls._model_name,
                        device='cpu',  # Use 'cuda' if GPU available
                        use_auth_token=False
                    )

                    # Force fast tokenizer to avoid warnings
                    try:
                        from transformers import AutoTokenizer
                        cls._model.tokenizer = AutoTokenizer.from_pretrained(
                            cls._model_name,
                            use_fast=True,
                            local_files_only=False
                        )
                    except Exception as e:
                        logger.warning(f"Could not load fast tokenizer: {e}")

                    load_time = time.time() - start_time
                    logger.info(
                        f"Model loaded in {load_time:.2f}s - Dimension: {cls._model.get_sentence_embedding_dimension()}")

        return cls._model

    @staticmethod
    def preprocess_texts(texts: List[str]) -> List[str]:
        """Enhanced text preprocessing for better embeddings"""
        processed_texts = []

        for text in texts:
            if not text or not isinstance(text, str):
                processed_texts.append("")
                continue

            # Advanced preprocessing
            processed = text.strip()

            # Remove excessive whitespace and special characters
            processed = ' '.join(processed.split())

            # Handle common abbreviations and patterns
            replacements = {
                "men's": "mens",
                "women's": "womens",
                "children's": "childrens",
                "&": "and",
                "+": "and",
                "/": " ",
            }

            for old, new in replacements.items():
                processed = processed.replace(old, new)

            # Limit very long texts (model has token limits)
            words = processed.split()
            if len(words) > 256:  # Reasonable limit for fashion items
                # Keep most important parts (beginning and end)
                processed = ' '.join(words[:128] + words[-128:])

            processed_texts.append(processed)

        return processed_texts

    @staticmethod
    def detect_text_quality(texts: List[str]) -> dict:
        """Analyze text quality for embedding optimization"""
        total_chars = 0
        total_words = 0
        empty_count = 0
        short_count = 0

        for text in texts:
            if not text:
                empty_count += 1
                continue

            total_chars += len(text)
            words = text.split()
            total_words += len(words)

            if len(words) < 3:
                short_count += 1

        avg_word_length = total_chars / max(total_words, 1)
        avg_words = total_words / max(len(texts), 1)

        return {
            'total_texts': len(texts),
            'empty_texts': empty_count,
            'short_texts': short_count,
            'avg_word_length': avg_word_length,
            'avg_words_per_text': avg_words,
            'quality_score': (total_words / max(len(texts) * 10, 1))  # Simple quality metric
        }


class EmbeddingPerformanceTracker:
    """Track embedding performance and optimize accordingly"""

    def __init__(self):
        self.stats = {
            'total_batches': 0,
            'total_texts': 0,
            'avg_batch_size': 0,
            'avg_processing_time': 0,
            'model_loaded': False
        }
        self.batch_times = []

    def log_batch_performance(self, batch_size: int, processing_time: float):
        """Log performance metrics for optimization"""
        self.stats['total_batches'] += 1
        self.stats['total_texts'] += batch_size
        self.stats['avg_batch_size'] = self.stats['total_texts'] / self.stats['total_batches']

        self.batch_times.append(processing_time)
        self.stats['avg_processing_time'] = sum(self.batch_times) / len(self.batch_times)

        logger.debug(f"Batch processed: {batch_size} texts in {processing_time:.3f}s "
                     f"({batch_size / processing_time:.1f} texts/sec)")

    def get_optimal_batch_size(self) -> int:
        """Dynamically determine optimal batch size"""
        if self.stats['total_batches'] < 5:
            return 32  # Conservative start

        avg_time = self.stats['avg_processing_time']
        avg_batch = self.stats['avg_batch_size']

        if avg_time < 1.0 and avg_batch < 100:
            return min(int(avg_batch * 1.5), 128)  # Increase gradually
        elif avg_time > 5.0:
            return max(int(avg_batch * 0.7), 16)  # Decrease if too slow
        else:
            return 64  # Stable default


class ImageEmbeddingModel:
    _model = None
    _lock = threading.Lock()
    _model_name = "clip-ViT-B-32"  # 512-dim

    @classmethod
    def get_model(cls):
        if cls._model is None:
            with cls._lock:
                if cls._model is None:
                    logger.info(f"Loading Image CLIP model: {cls._model_name}")
                    cls._model = SentenceTransformer(cls._model_name)

                    # Force fast tokenizer for CLIP model as well
                    try:
                        from transformers import AutoTokenizer
                        cls._model.tokenizer = AutoTokenizer.from_pretrained(
                            "sentence-transformers/clip-ViT-B-32",
                            use_fast=True,
                            local_files_only=False
                        )
                    except Exception as e:
                        logger.warning(f"Could not load fast tokenizer for CLIP: {e}")
        return cls._model

    @staticmethod
    def decode_base64_image(base64_str):
        try:
            # Handle base64 string (remove data URL prefix if present)
            if base64_str.startswith('data:image'):
                base64_str = base64_str.split(',')[1]

            img_bytes = base64.b64decode(base64_str)
            img = Image.open(BytesIO(img_bytes)).convert("RGB")
            return img
        except Exception as e:
            logger.error(f"Failed to decode base64 image: {e}")
            raise ValueError(f"Invalid image data: {e}")


# Global performance tracker
performance_tracker = EmbeddingPerformanceTracker()


@lru_cache(maxsize=1000)
def embed_single_text_cached(text: str) -> List[float]:
    """Cache embeddings for frequently used texts"""
    if not text:
        return [0.0] * 768  # Return zero vector for empty text

    model = EnhancedSentenceTransformer.get_model()
    embedding = model.encode([text], show_progress_bar=False, convert_to_numpy=True)
    return embedding[0].tolist()


def embed_texts(
        texts: List[str],
        batch_size: int = None,
        show_progress_bar: bool = False,
        use_cache: bool = True,
        normalize: bool = True
) -> List[List[float]]:
    """
    Enhanced text embedding with performance optimizations

    Args:
        texts: List of texts to embed
        batch_size: Optional batch size (auto-optimized if None)
        show_progress_bar: Whether to show progress bar
        use_cache: Whether to use caching for frequent texts
        normalize: Whether to L2 normalize embeddings
    """
    if not texts:
        return []

    start_time = time.time()

    # Auto-optimize batch size if not specified
    if batch_size is None:
        batch_size = performance_tracker.get_optimal_batch_size()

    logger.info(f"Embedding {len(texts)} texts with batch size {batch_size}")

    # Analyze text quality
    quality_info = EnhancedSentenceTransformer.detect_text_quality(texts)
    logger.debug(f"Text quality analysis: {quality_info}")

    # Preprocess texts
    processed_texts = EnhancedSentenceTransformer.preprocess_texts(texts)

    # Get model
    model = EnhancedSentenceTransformer.get_model()
    performance_tracker.stats['model_loaded'] = True

    all_embeddings = []

    try:
        # Process in batches for memory efficiency
        for i in range(0, len(processed_texts), batch_size):
            batch_texts = processed_texts[i:i + batch_size]
            batch_original = texts[i:i + batch_size]

            # Check cache for frequently used texts
            batch_embeddings = []
            texts_to_encode = []
            cache_indices = []

            if use_cache:
                for j, (processed, original) in enumerate(zip(batch_texts, batch_original)):
                    if len(original) < 100:  # Only cache shorter texts
                        cached_embedding = embed_single_text_cached(original)
                        batch_embeddings.append(cached_embedding)
                    else:
                        texts_to_encode.append(processed)
                        cache_indices.append(j)
            else:
                texts_to_encode = batch_texts
                cache_indices = list(range(len(batch_texts)))

            # Encode non-cached texts
            if texts_to_encode:
                batch_start = time.time()
                new_embeddings = model.encode(
                    texts_to_encode,
                    show_progress_bar=show_progress_bar,
                    convert_to_numpy=True,
                    batch_size=min(len(texts_to_encode), 32),  # Smaller batch for encoding
                    normalize_embeddings=normalize
                )
                batch_time = time.time() - batch_start

                # Log performance
                performance_tracker.log_batch_performance(len(texts_to_encode), batch_time)

                # Convert to list and assign to correct positions
                new_embeddings_list = new_embeddings.tolist()
                for idx, embedding in zip(cache_indices, new_embeddings_list):
                    if idx < len(batch_embeddings):
                        batch_embeddings.insert(idx, embedding)
                    else:
                        batch_embeddings.append(embedding)

            all_embeddings.extend(batch_embeddings)

        # Ensure we have the right number of embeddings
        if len(all_embeddings) != len(texts):
            logger.warning(f"Embedding count mismatch: expected {len(texts)}, got {len(all_embeddings)}")
            # Fallback: embed all texts without caching
            all_embeddings = model.encode(
                processed_texts,
                show_progress_bar=show_progress_bar,
                convert_to_numpy=True
            ).tolist()

        # Final normalization if requested
        if normalize and not model._first_module().normalize_embeddings:
            embeddings_array = np.array(all_embeddings)
            faiss.normalize_L2(embeddings_array)
            all_embeddings = embeddings_array.tolist()

        total_time = time.time() - start_time
        logger.info(f"Embedding completed: {len(texts)} texts in {total_time:.2f}s "
                    f"({len(texts) / total_time:.1f} texts/sec)")

        return all_embeddings

    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        # Fallback to simple embedding
        logger.info("Attempting fallback embedding...")
        model = EnhancedSentenceTransformer.get_model()
        fallback_embeddings = model.encode(
            processed_texts,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=normalize
        )
        return fallback_embeddings.tolist()


def get_embedding_dimension() -> int:
    """Get the dimension of embeddings"""
    model = EnhancedSentenceTransformer.get_model()
    return model.get_sentence_embedding_dimension()


def validate_embeddings(embeddings: List[List[float]]) -> bool:
    """Validate that embeddings are correct"""
    if not embeddings:
        return False

    expected_dim = get_embedding_dimension()

    for i, emb in enumerate(embeddings):
        if len(emb) != expected_dim:
            logger.error(f"Embedding {i} has wrong dimension: {len(emb)} != {expected_dim}")
            return False

        if not any(emb):  # Check if all zeros
            logger.warning(f"Embedding {i} is all zeros")

    return True


# Utility function for single text embedding
def embed_text(text: str, normalize: bool = True) -> List[float]:
    """Convenience function for embedding single text"""
    return embed_texts([text], normalize=normalize)[0]


def embed_image(base64_image: str, normalize: bool = True) -> List[float]:
    """
    Enhanced image embedding with better error handling
    """
    try:
        model = ImageEmbeddingModel.get_model()

        # Clean the base64 string
        if base64_image.startswith('data:image'):
            # Remove data URL prefix
            base64_image = base64_image.split(',')[1]

        # Add padding if needed (base64 strings should be divisible by 4)
        padding = len(base64_image) % 4
        if padding:
            base64_image += '=' * (4 - padding)

        logger.info(f"Decoding base64 image, length: {len(base64_image)}")

        img = ImageEmbeddingModel.decode_base64_image(base64_image)
        logger.info(f"Image decoded successfully: {img.size}")

        # Encode the image
        embedding = model.encode([img], convert_to_numpy=True, show_progress_bar=False)[0]
        logger.info(f"Image embedding generated: {len(embedding)} dimensions")

        if normalize:
            embedding = embedding / np.linalg.norm(embedding)

        return embedding.tolist()

    except Exception as e:
        logger.error(f"Image embedding failed: {e}")
        logger.error(traceback.format_exc())
        raise ValueError(f"Failed to process image: {str(e)}")


# Performance monitoring endpoint
def get_embedding_stats() -> dict:
    """Get embedding performance statistics"""
    stats = performance_tracker.stats.copy()
    stats['embedding_dimension'] = get_embedding_dimension()
    stats['cache_info'] = embed_single_text_cached.cache_info()
    return stats


# Pre-warm the model (optional, for production)
def prewarm_model():
    """Pre-warm the model on startup"""
    logger.info("Pre-warming embedding model...")
    test_texts = [
        "men's running shoes",
        "women's summer dress",
        "comfortable casual wear",
        "formal business attire"
    ]
    embed_texts(test_texts, show_progress_bar=False)
    logger.info("Model pre-warming completed")
