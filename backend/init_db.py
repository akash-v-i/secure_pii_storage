"""
Database initialization script
Creates databases and tables
"""
import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE_PII = os.getenv("MYSQL_DATABASE_PII", "pii_db")
MYSQL_DATABASE_KEYS = os.getenv("MYSQL_DATABASE_KEYS", "key_storage_db")

# Base connection (without database)
BASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}"

def create_databases():
    """Create databases if they don't exist"""
    engine = create_engine(BASE_URL)
    
    with engine.connect() as conn:
        # Create PII database
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE_PII}"))
        conn.commit()
        print(f"[OK] Database '{MYSQL_DATABASE_PII}' created/verified")
        
        # Create Keys database
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE_KEYS}"))
        conn.commit()
        print(f"[OK] Database '{MYSQL_DATABASE_KEYS}' created/verified")
    
    engine.dispose()


def create_tables():
    """Create all tables"""
    from db.session import pii_engine, keys_engine, PIIDeclarativeBase, KeysDeclarativeBase
    from db import pii_db, key_db
    
    # Create PII database tables
    PIIDeclarativeBase.metadata.create_all(bind=pii_engine)
    print("[OK] PII database tables created")
    
    # Create Keys database tables
    KeysDeclarativeBase.metadata.create_all(bind=keys_engine)
    print("[OK] Keys database tables created")


def create_default_admin():
    """Create default admin user"""
    from db.session import PIISessionLocal
    from db.pii_db import User, UserRole
    from utils.jwt_handler import get_password_hash
    
    db = PIISessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@vault.com").first()
        if not admin:
            admin = User(
                email="admin@vault.com",
                username="Admin User",
                hashed_password=get_password_hash("Admin123!"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("[OK] Default admin user created: admin@vault.com / Admin123!")
        # Check if auditor exists
        auditor = db.query(User).filter(User.email == "auditor@vault.com").first()
        if not auditor:
            auditor = User(
                email="auditor@vault.com",
                username="Security Auditor",
                hashed_password=get_password_hash("Audit123!"),
                role=UserRole.AUDITOR,
                is_active=True
            )
            db.add(auditor)
            db.commit()
            print("[OK] Default auditor user created: auditor@vault.com / Audit123!")
        else:
            print("[OK] Auditor user already exists")

    except Exception as e:

        print(f"[ERROR] Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing SECURE-VAULT databases...")
    print("-" * 50)
    
    try:
        create_databases()
        create_tables()
        create_default_admin()
        print("-" * 50)
        print("[OK] Database initialization complete!")
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        sys.exit(1)
