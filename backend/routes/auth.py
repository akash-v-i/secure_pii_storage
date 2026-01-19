"""
Authentication routes - Login, Register, Password Reset
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta

from db.session import get_pii_db
from db.pii_db import User, UserRole, LoginAttempt, PasswordResetOTP
from utils.jwt_handler import verify_password, get_password_hash, create_access_token, decode_access_token
from utils.validation import validate_email_format, validate_password_strength, sanitize_input
from utils.logger import setup_logger
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from utils.geoip import get_location_from_ip

router = APIRouter()
security = HTTPBearer()
logger = setup_logger()

# Rate limiting (can be added per endpoint if needed)


class RegisterRequest(BaseModel):
    email: str
    password: str
    username: str
    captcha: Optional[str] = None  # For reCAPTCHA validation


class LoginRequest(BaseModel):
    email: str
    password: str
    captcha: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class RegisterResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_pii_db)
) -> User:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        logger.warning(f"Token validation failed for token: {token[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing sub"
        )
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: invalid sub format"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is locked"
        )
    
    return user


@router.post("/register", response_model=RegisterResponse)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_pii_db),
    client_ip: str = Depends(get_remote_address)
):
    """User registration endpoint"""
    try:
        # Validate and sanitize input
        email = sanitize_input(request.email.lower())
        username = sanitize_input(request.username, max_length=255)
        password = request.password
        
        # Validate email
        if not validate_email_format(email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )
        
        # Validate password
        is_valid, error_msg = validate_password_strength(password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        
        # Check if user exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(password)
        new_user = User(
            email=email,
            username=username,
            hashed_password=hashed_password,
            role=UserRole.USER,
            is_active=True,
            is_locked=False
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create access token
        access_token = create_access_token(data={"sub": new_user.id, "role": new_user.role.value})
        
        logger.info(f"New user registered: {email}")
        
        return RegisterResponse(
            success=True,
            message="Registration successful",
            access_token=access_token
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    fastapi_request: Request,
    db: Session = Depends(get_pii_db),
    client_ip: str = Depends(get_remote_address)
):

    """User login endpoint"""
    try:
        # Validate CAPTCHA (simple check for now - can integrate reCAPTCHA)
        if request.captcha.lower() != "secure":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid CAPTCHA"
            )
        
        # Find user
        email = sanitize_input(request.email.lower())
        user = db.query(User).filter(User.email == email).first()
        
        # Get location
        location = get_location_from_ip(client_ip)
        
        # Log login attempt
        login_attempt = LoginAttempt(
            email=email,
            ip_address=client_ip,
            location=location,
            success=False,
            user_agent=fastapi_request.headers.get("user-agent")
        )


        
        if not user:
            db.add(login_attempt)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if account is locked
        if user.is_locked:
            db.add(login_attempt)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is locked. Please contact administrator."
            )
        
        # Verify password
        if not verify_password(request.password, user.hashed_password):
            # Increment failed attempts
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.is_locked = True
            db.add(login_attempt)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Successful login
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        login_attempt.success = True
        
        db.add(login_attempt)
        db.commit()
        
        # Create access token
        access_token = create_access_token(data={"sub": user.id, "role": user.role.value})
        
        logger.info(f"User logged in: {email}")
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role.value,
                "lastLogin": user.last_login.isoformat() if user.last_login else None
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout endpoint (token invalidation handled client-side for JWT)"""
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "role": current_user.role.value,
        "lastLogin": current_user.last_login.isoformat() if current_user.last_login else None,
        "isActive": current_user.is_active
    }


@router.get("/history")
async def get_login_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_pii_db)
):
    """Get login history for current user"""
    try:
        attempts = db.query(LoginAttempt).filter(
            LoginAttempt.email == current_user.email
        ).order_by(LoginAttempt.timestamp.desc()).limit(20).all()
        
        result = []
        for attempt in attempts:
            result.append({
                "id": str(attempt.id),
                "timestamp": attempt.timestamp.isoformat(),
                "ipAddress": attempt.ip_address,
                "location": attempt.location,
                "status": "success" if attempt.success else "failed",
                "device": "Unknown" # Ideally parse user agent
            })
            
        return {"history": result}
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")
