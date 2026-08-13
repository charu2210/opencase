from typing import Optional, Dict, Any
from .registry import cache_registry
import hashlib

def generate_cache_key(case_id: str, mode: str, question: str) -> str:
    """Generate a unique cache key based on the context."""
    raw_key = f"{case_id}:{mode}:{question.strip().lower()}"
    return hashlib.sha256(raw_key.encode('utf-8')).hexdigest()

def get_cached_response(key: str) -> Optional[str]:
    """Helper to get cached response natively."""
    return cache_registry.get(key)

def set_cached_response(key: str, response: str, ttl: int = 3600) -> None:
    """Helper to set cached response natively."""
    cache_registry.set(key, response, ttl)

def get_cache_statistics() -> Dict[str, Any]:
    """Get current cache stats."""
    return cache_registry.get_stats()
