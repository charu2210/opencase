"""
OpenCase Backend — FastAPI
Main application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import cases, investigator, theory

app = FastAPI(
    title="OpenCase API",
    description="AI-powered investigative intelligence platform backend",
    version="1.0.0"
)

# Allow requests from the Next.js frontend (localhost:3000 in development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route groups
app.include_router(cases.router, prefix="/api/cases", tags=["Cases"])
app.include_router(investigator.router, prefix="/api/investigator", tags=["AI Investigator"])
app.include_router(theory.router, prefix="/api/theory", tags=["Theory Tools"])


@app.get("/")
def root():
    return {"message": "OpenCase API is running", "version": "1.0.0"}

@app.get("/api/cache/stats", tags=["System"])
def cache_stats():
    from mcp.cache_tools import get_cache_statistics
    return get_cache_statistics()
