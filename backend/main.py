"""
SECURE-VAULT FastAPI Application
Main entry point for the backend API
# Trigger reload for env update
"""
import os
from dotenv import load_dotenv

# Load environment variables from the directory containing main.py
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path, override=True)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from routes import auth, vault, admin
from utils.logger import setup_logger

# Initialize logger
logger = setup_logger()

# Initialize FastAPI app
app = FastAPI(
    title="SECURE-VAULT API",
    description="Secure PII Management System API",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") == "development" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") == "development" else None,
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:4173")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

print(f"DIAGNOSTIC: ENVIRONMENT is '{os.getenv('ENVIRONMENT')}'")
print(f"DIAGNOSTIC: CORS_ORIGINS requested are {cors_origins}")

# In production, you might want to restrict this further, but let's make it easy to start
if os.getenv("ENVIRONMENT") == "development":
    print("DIAGNOSTIC: CORS mode is DEVELOPMENT (allow all origins, credentials disabled for wildcard)")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False, # Must be False if origins is ["*"]
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    print(f"DIAGNOSTIC: CORS mode is PRODUCTION (restricted to {cors_origins})")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )





# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(vault.router, prefix="/api/vault", tags=["Vault"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "SECURE-VAULT API"
    }

# --- Frontend Hosting Configuration ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException

dist_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")

if os.path.exists(dist_path) and os.path.isdir(dist_path):
    print("DIAGNOSTIC: Running in combined hosting mode (serving frontend from dist)")
    
    # Serve assets folder
    assets_path = os.path.join(dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
        
    # Other public files (vite.svg, etc) could also be mounted here,
    # but our catch-all route handles them just fine.

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Ignore API paths
        if full_path.startswith("api/") or full_path.startswith("auth/"):
            raise HTTPException(status_code=404, detail="API route not found")
            
        file_path = os.path.join(dist_path, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Fallback to index.html for React Router
        index_path = os.path.join(dist_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="File not found in dist")
else:
    print("DIAGNOSTIC: Running in API-only mode (no dist folder found)")
    @app.get("/")
    async def root():
        """Health check endpoint"""
        return {
            "status": "ok",
            "message": "SECURE-VAULT API is running",
            "version": "1.0.0"
        }



if __name__ == "__main__":
    import uvicorn
    # Use PORT environment variable if available (standard for hosting platforms)
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development"
    )

