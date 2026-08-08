"""
OpenCase Backend — FastAPI
Main application entry point.
"""

 feature/ai-endpoint-validation
from fastapi import FastAPI, Request

import logging

from fastapi import FastAPI
main
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
from routers import cases, investigator, theory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("opencase.startup")

app = FastAPI(
    title="OpenCase API",
    description="AI-powered investigative intelligence platform backend",
    version="1.0.0"
)


 feature/ai-endpoint-validation
# ─── Global error handlers ───────────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder({"error": "validation_error", "detail": exc.errors()})
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "request_error", "detail": exc.detail}
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
 main

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