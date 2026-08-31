import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import sys
import os

# Add backend dir to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from mcp.registry import cache_registry

@pytest.fixture(autouse=True)
def clear_cache():
    """Clear cache before every test."""
    cache_registry.store.clear()
    cache_registry.hits = 0
    cache_registry.misses = 0
    yield

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_gemini():
    with patch("routers.investigator.call_gemini", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = "This is a mocked AI response."
        yield mock_call

@pytest.fixture
def mock_theory_gemini():
    with patch("routers.theory.call_gemini", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = "This is a mocked theory response."
        yield mock_call
