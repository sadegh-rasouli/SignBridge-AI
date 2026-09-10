"""
SignBridge AI - FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router as api_router

app = FastAPI(
    title="SignBridge AI API",
    description="Real-Time Sign Language Recognition & Communication Platform API",
    version="1.0.0-MVP",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows browser frontend dev access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
def root():
    return {
        "project": "SignBridge AI",
        "description": "Production-Grade AI Sign Language Communication Platform",
        "version": "1.0.0-MVP",
        "docs": "/docs",
        "api_v1": "/api/v1"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
