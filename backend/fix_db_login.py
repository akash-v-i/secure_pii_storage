
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

# Connection URL
DB_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE_PII}"

def fix_table():
    engine = create_engine(DB_URL)
    
    with engine.connect() as conn:
        print("Dropping login_attempts table...")
        conn.execute(text("DROP TABLE IF EXISTS login_attempts"))
        conn.commit()
        print("Table dropped.")
        
    engine.dispose()
    
    print("Recreating tables...")
    # Import here to register models
    from db.session import pii_engine, PIIDeclarativeBase
    from db import pii_db
    
    # Create tables
    PIIDeclarativeBase.metadata.create_all(bind=pii_engine)
    print("Tables recreated with new schema.")

if __name__ == "__main__":
    try:
        fix_table()
        print("Fix complete!")
    except Exception as e:
        print(f"Error: {e}")
