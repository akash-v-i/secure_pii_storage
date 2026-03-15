"""
PII Database Models
Contains all models for the pii_db database
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from db.session import PIIDeclarativeBase


class UserRole(str, enum.Enum):
    """User role enumeration"""
    USER = "user"
    ADMIN = "admin"
    AUDITOR = "auditor"


class DeletionRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class User(PIIDeclarativeBase):
    """User model for authentication and authorization"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class PIIRecord(PIIDeclarativeBase):
    """PII data records - encrypted storage"""
    __tablename__ = "pii_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # PII Category
    category = Column(String(50), nullable=False, index=True)  # basic_identifiers, government_identifiers, etc.
    pii_type = Column(String(50), nullable=False)  # ssn, passport, credit_card, etc.
    type_label = Column(String(255), nullable=False)  # "Social Security Number"
    
    # Encrypted data
    encrypted_value = Column(Text, nullable=False)  # AES-GCM encrypted value
    nonce = Column(String(255), nullable=False)  # Nonce for GCM encryption
    key_id = Column(String(255), nullable=False)  # Reference to encryption key
    
    # Metadata
    label = Column(String(255), nullable=False)  # User-friendly label
    notes = Column(Text, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    
    # Access tracking
    last_accessed = Column(DateTime, nullable=True)
    access_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", backref="pii_records")


class PIIFile(PIIDeclarativeBase):
    """Encrypted file storage"""
    __tablename__ = "pii_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)  # Size in bytes
    
    # Encrypted data (stored as hex string, similar to PII record)
    # Use LONGTEXT for large files (Text is limited to 64KB)
    encrypted_data = Column(LONGTEXT, nullable=False)  # Hex encoded encrypted binary
    nonce = Column(String(255), nullable=False)
    key_id = Column(String(255), nullable=False)
    
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", backref="pii_files")


class LoginAttempt(PIIDeclarativeBase):
    """Login attempt tracking for security audit"""
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    location = Column(String(255), nullable=True)  # City, Country
    user_agent = Column(String(500), nullable=True)
    success = Column(Boolean, nullable=False)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False, index=True)


class AuditLog(PIIDeclarativeBase):
    """General audit log for all security-relevant events"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    email = Column(String(255), nullable=True) # In case user is deleted
    event_type = Column(String(50), nullable=False)  # PII_ACCESS, PII_CREATE, PII_DELETE, etc.
    description = Column(Text, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    user = relationship("User")


class PasswordResetOTP(PIIDeclarativeBase):
    """Password reset OTP storage"""
    __tablename__ = "password_reset_otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    otp = Column(String(6), nullable=False)  # 6-digit OTP
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User")


class DeletionRequest(PIIDeclarativeBase):
    """Data deletion requests"""
    __tablename__ = "deletion_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    status = Column(SQLEnum(DeletionRequestStatus), default=DeletionRequestStatus.PENDING, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", backref="deletion_requests")
