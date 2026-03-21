"""
SECURE-VAULT FastAPI Application
Main entry point for the backend API
"""
import os
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path, override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from routes import auth, vault, admin
from utils.logger import setup_logger

# Initialize logger
logger = setup_logger()

# Environment
environment = os.getenv("ENVIRONMENT", "development")

# Initialize FastAPI app
app = FastAPI(
    title="SECURE-VAULT API",
    description="Secure PII Management System API",
    version="1.0.0",
    docs_url="/docs" if environment == "development" else None,
    redoc_url="/redoc" if environment == "development" else None,
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# =========================
# ✅ FIXED CORS CONFIGURATION
# =========================
cors_origins_str = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:4173"
)

cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

print(f"DIAGNOSTIC: ENVIRONMENT is '{environment}'")
print(f"DIAGNOSTIC: CORS_ORIGINS allowed: {cors_origins}")

# 🔥 ALWAYS USE EXPLICIT ORIGINS (NO "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,   # ✅ FIXED
    allow_credentials=True,       # ✅ REQUIRED for auth
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ROUTES
# =========================
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(vault.router, prefix="/api/vault", tags=["Vault"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# =========================
# HEALTH CHECKS
# =========================
@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "SECURE-VAULT API is running",
        "version": "1.0.0",
        "environment": environment
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SECURE-VAULT API",
        "environment": environment,
    }

# =========================
# ENTRY POINT
# =========================
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )