"""
Key Storage Database Models
Contains models for the key_storage_db database
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from db.session import KeysDeclarativeBase


class FieldKey(KeysDeclarativeBase):
    """Encryption key storage - separate database for security"""
    __tablename__ = "field_keys"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(String(255), unique=True, index=True, nullable=False)  # Unique key identifier
    wrapped_key = Column(Text, nullable=False)  # Encrypted (wrapped) Data Encryption Key (DEK)
    master_key_version = Column(String(50), nullable=False)  # Version of master key used
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    rotated_at = Column(DateTime, nullable=True)  # When key was rotated
    expires_at = Column(DateTime, nullable=True)  # Optional key expiration
