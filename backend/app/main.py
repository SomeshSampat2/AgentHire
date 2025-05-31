from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

from app.api import routes
from app.core.config import settings

# Load environment variables
load_dotenv()

app = FastAPI(
    title="HireAgent API",
    description="AI-powered hiring assistant for HR professionals",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
upload_dir = settings.UPLOAD_DIR
os.makedirs(upload_dir, exist_ok=True)

# Mount static files for uploaded documents
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Exception handler for HTTPException to ensure JSON responses
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

# Include API routes
app.include_router(routes.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "HireAgent API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "HireAgent API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 