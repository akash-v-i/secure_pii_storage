"""
Database session management for dual database setup
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Database URLs
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE_PII = os.getenv("MYSQL_DATABASE_PII", "pii_db")
MYSQL_DATABASE_KEYS = os.getenv("MYSQL_DATABASE_KEYS", "key_storage_db")

# Connection strings
PII_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE_PII}"
KEYS_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE_KEYS}"

# Create engines
pii_engine = create_engine(
    PII_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False  # Set to True for SQL query logging
)

keys_engine = create_engine(
    KEYS_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

# Session makers
PIISessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=pii_engine)
KeysSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=keys_engine)

# Base classes for models
PIIDeclarativeBase = declarative_base()
KeysDeclarativeBase = declarative_base()


def get_pii_db():
    """Dependency to get PII database session"""
    db = PIISessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_keys_db():
    """Dependency to get Keys database session"""
    db = KeysSessionLocal()
    try:
        yield db
    finally:
        db.close()
