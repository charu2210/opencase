import time
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class CacheBackend(ABC):
    @abstractmethod
    def get(self, key: str) -> Optional[str]:
        pass

    @abstractmethod
    def set(self, key: str, value: str, ttl: int = 3600) -> None:
        pass

    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        pass

class InMemoryCache(CacheBackend):
    def __init__(self):
        self.store: Dict[str, Dict[str, Any]] = {}
        self.hits = 0
        self.misses = 0

    def _cleanup(self):
        now = time.time()
        expired = [k for k, v in self.store.items() if v["expires_at"] and v["expires_at"] < now]
        for k in expired:
            del self.store[k]

    def get(self, key: str) -> Optional[str]:
        self._cleanup()
        if key in self.store:
            self.hits += 1
            return self.store[key]["value"]
        self.misses += 1
        return None

    def set(self, key: str, value: str, ttl: int = 3600) -> None:
        self._cleanup()
        expires_at = time.time() + ttl if ttl else None
        self.store[key] = {"value": value, "expires_at": expires_at}

    def get_stats(self) -> Dict[str, Any]:
        self._cleanup()
        return {
            "hits": self.hits,
            "misses": self.misses,
            "total_keys": len(self.store)
        }

# Global cache instance (can be replaced with Redis later)
cache_registry = InMemoryCache()
