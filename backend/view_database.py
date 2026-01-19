"""
Script to view data from SECURE-VAULT MySQL databases
Run: python view_database.py
"""
import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE_PII = os.getenv("MYSQL_DATABASE_PII", "pii_db")
MYSQL_DATABASE_KEYS = os.getenv("MYSQL_DATABASE_KEYS", "key_storage_db")

def view_pii_database():
    """View data from pii_db"""
    url = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE_PII}"
    engine = create_engine(url)
    
    print("=" * 80)
    print(f"PII DATABASE: {MYSQL_DATABASE_PII}")
    print("=" * 80)
    
    with engine.connect() as conn:
        # View Users
        print("\n[USERS TABLE]")
        print("-" * 80)
        result = conn.execute(text("SELECT id, email, username, role, is_active, is_locked, last_login, created_at FROM users"))
        users = result.fetchall()
        if users:
            print(f"{'ID':<5} {'Email':<30} {'Username':<20} {'Role':<10} {'Active':<8} {'Locked':<8} {'Last Login':<20}")
            print("-" * 80)
            for row in users:
                last_login = str(row[6])[:19] if row[6] else "Never"
                print(f"{row[0]:<5} {row[1]:<30} {row[2]:<20} {row[3]:<10} {str(row[4]):<8} {str(row[5]):<8} {last_login:<20}")
        else:
            print("No users found")
        
        # View PII Records
        print("\n[PII RECORDS TABLE]")
        print("-" * 80)
        result = conn.execute(text("""
            SELECT id, user_id, category, pii_type, type_label, label, 
                   expiry_date, last_accessed, access_count, created_at 
            FROM pii_records 
            ORDER BY created_at DESC
        """))
        records = result.fetchall()
        if records:
            print(f"{'ID':<5} {'User':<5} {'Category':<20} {'Type':<15} {'Label':<25} {'Expiry':<12} {'Access':<8} {'Created':<20}")
            print("-" * 80)
            for row in records:
                expiry = str(row[6])[:10] if row[6] else "No expiry"
                last_acc = str(row[7])[:19] if row[7] else "Never"
                created = str(row[9])[:19] if row[9] else ""
                print(f"{row[0]:<5} {row[1]:<5} {row[2]:<20} {row[3]:<15} {str(row[5]):<25} {expiry:<12} {row[8]:<8} {created:<20}")
        else:
            print("No PII records found")
        
        # View Login Attempts (last 10)
        print("\n[LOGIN ATTEMPTS TABLE - Last 10]")
        print("-" * 80)
        result = conn.execute(text("""
            SELECT id, email, ip_address, success, timestamp 
            FROM login_attempts 
            ORDER BY timestamp DESC 
            LIMIT 10
        """))
        attempts = result.fetchall()
        if attempts:
            print(f"{'ID':<5} {'Email':<30} {'IP Address':<20} {'Success':<8} {'Timestamp':<20}")
            print("-" * 80)
            for row in attempts:
                timestamp = str(row[4])[:19] if row[4] else ""
                print(f"{row[0]:<5} {row[1]:<30} {str(row[2]):<20} {str(row[3]):<8} {timestamp:<20}")
        else:
            print("No login attempts found")
    
    engine.dispose()


def view_keys_database():
    """View data from key_storage_db"""
    url = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE_KEYS}"
    engine = create_engine(url)
    
    print("\n" + "=" * 80)
    print(f"KEYS DATABASE: {MYSQL_DATABASE_KEYS}")
    print("=" * 80)
    
    with engine.connect() as conn:
        # View Field Keys
        print("\n[FIELD KEYS TABLE]")
        print("-" * 80)
        result = conn.execute(text("""
            SELECT id, key_id, is_active, created_at, expires_at 
            FROM field_keys 
            ORDER BY created_at DESC
        """))
        keys = result.fetchall()
        if keys:
            print(f"{'ID':<5} {'Key ID':<35} {'Active':<8} {'Created':<20} {'Expires':<20}")
            print("-" * 80)
            for row in keys:
                created = str(row[3])[:19] if row[3] else ""
                expires = str(row[4])[:19] if row[4] else "No expiry"
                print(f"{row[0]:<5} {str(row[1]):<35} {str(row[2]):<8} {created:<20} {expires:<20}")
        else:
            print("No encryption keys found")
    
    engine.dispose()


if __name__ == "__main__":
    try:
        view_pii_database()
        view_keys_database()
        print("\n" + "=" * 80)
        print("Database view complete!")
        print("=" * 80)
    except Exception as e:
        print(f"[ERROR] Failed to view database: {e}")
        print(f"Make sure MySQL is running and credentials in .env are correct")
        sys.exit(1)
