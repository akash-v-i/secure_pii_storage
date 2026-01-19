"""
Input validation and sanitization utilities
"""
import bleach
import re
from typing import Optional
from email_validator import validate_email, EmailNotValidError


def sanitize_input(text: str, max_length: Optional[int] = None) -> str:
    """Sanitize user input to prevent XSS attacks"""
    if not text:
        return ""
    
    # Clean HTML tags and scripts
    cleaned = bleach.clean(text, tags=[], strip=True)
    
    # Trim whitespace
    cleaned = cleaned.strip()
    
    # Limit length if specified
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    
    return cleaned


def validate_email_format(email: str) -> bool:
    """Validate email format"""
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength
    Returns: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, None


def sanitize_sql_input(text: str) -> str:
    """Additional SQL injection prevention (though SQLAlchemy handles this)"""
    # Remove SQL keywords and special characters that could be dangerous
    dangerous_chars = ["'", '"', ';', '--', '/*', '*/', 'xp_', 'sp_']
    cleaned = text
    for char in dangerous_chars:
        cleaned = cleaned.replace(char, '')
    return cleaned
