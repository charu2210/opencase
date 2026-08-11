"""
OpenCase Backend — FastAPI
Main application entry point.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import cases, investigator, theory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("opencase.startup")

app = FastAPI(
    title="OpenCase API",
    description="AI-powered investigative intelligence platform backend",
    version="1.0.0"
)


@app.on_event("startup")
def validate_investigation_files() -> None:
    """
    Validate every investigation file up front so a single malformed or
    incomplete case file is reported clearly and skipped, instead of
    surfacing later as an unhandled crash on first request — or worse,
    silently taking the whole app down at startup.
    """
    valid_case_ids, error_report = cases.load_all_cases_validated()

    logger.info("Validated investigation files: %d valid, %d invalid",
                len(valid_case_ids), len(error_report))

    for case_id, errors in error_report.items():
        logger.warning("Case '%s' skipped — %s", case_id, "; ".join(errors))

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