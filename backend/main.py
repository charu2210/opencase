"""
OpenCase Backend — FastAPI
Main application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
from routers import cases, investigator, theory

app = FastAPI(
    title="OpenCase API",
    description="AI-powered investigative intelligence platform backend",
    version="1.0.0"
)


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