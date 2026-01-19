# How to View Data in MySQL Database

## Method 1: Python Script (Easiest) ✅

I've created a script that displays all your database data in a readable format:

```bash
cd backend
python view_database.py
```

This will show:
- **Users table**: All registered users
- **PII Records**: All stored PII data (encrypted values, not decrypted)
- **Login Attempts**: Recent login history
- **Field Keys**: Encryption keys (wrapped/encrypted)

## Method 2: MySQL Command Line

### Connect to MySQL:
```bash
mysql -u root -p
# Enter password: 2407
```

### View PII Database:
```sql
-- Switch to PII database
USE pii_db;

-- View all users
SELECT * FROM users;

-- View PII records
SELECT id, user_id, category, pii_type, type_label, label, created_at 
FROM pii_records;

-- View recent login attempts
SELECT * FROM login_attempts ORDER BY timestamp DESC LIMIT 10;

-- Count records per user
SELECT user_id, COUNT(*) as record_count 
FROM pii_records 
GROUP BY user_id;
```

### View Keys Database:
```sql
-- Switch to keys database
USE key_storage_db;

-- View encryption keys (wrapped keys, not decryptable without master key)
SELECT id, key_id, is_active, created_at FROM field_keys;
```

## Method 3: MySQL Workbench (GUI Tool)

### If you have MySQL Workbench installed:

1. **Open MySQL Workbench**
2. **Create New Connection:**
   - Host: `localhost`
   - Port: `3306`
   - Username: `root`
   - Password: `2407`

3. **Connect and Browse:**
   - Click on `pii_db` database
   - Double-click tables to view data
   - Use SQL Editor to run queries

### Useful Queries in Workbench:

```sql
-- View all users
SELECT * FROM pii_db.users;

-- View PII records summary
SELECT 
    id, 
    user_id, 
    category, 
    pii_type, 
    type_label, 
    label, 
    expiry_date,
    access_count,
    created_at
FROM pii_db.pii_records
ORDER BY created_at DESC;

-- View login history
SELECT 
    email, 
    ip_address, 
    success, 
    timestamp 
FROM pii_db.login_attempts 
ORDER BY timestamp DESC 
LIMIT 20;

-- Count records by category
SELECT category, COUNT(*) as count 
FROM pii_db.pii_records 
GROUP BY category;
```

## Method 4: VS Code MySQL Extension

1. **Install Extension:**
   - Search for "MySQL" extension in VS Code
   - Install by "WeChat" or similar

2. **Connect:**
   - Click MySQL icon in sidebar
   - Add connection:
     - Host: `localhost`
     - User: `root`
     - Password: `2407`
     - Database: `pii_db`

3. **Browse:**
   - Expand database and tables
   - Right-click table → "Show Table Data"

## Method 5: phpMyAdmin (Web Interface)

If you have XAMPP/WAMP installed:

1. Start Apache and MySQL in XAMPP/WAMP
2. Open: `http://localhost/phpmyadmin`
3. Login with: `root` / `2407`
4. Select database: `pii_db` or `key_storage_db`
5. Click on tables to view data

## Important Notes:

### 🔒 Security Warnings:

1. **Encrypted Data**: PII values in `pii_records.encrypted_value` are encrypted - you cannot read them directly
2. **Wrapped Keys**: Keys in `field_keys.wrapped_key` are wrapped (encrypted) - not readable without master key
3. **Passwords**: User passwords are hashed (bcrypt) - not reversible

### 📊 What You CAN See:

✅ User emails and usernames  
✅ PII record metadata (labels, types, categories)  
✅ Access counts and timestamps  
✅ Login attempt history  
✅ User roles and account status  

### 🚫 What You CANNOT See (By Design):

❌ Actual PII values (they're encrypted)  
❌ User passwords (they're hashed)  
❌ Decryption keys (they're wrapped)  

## Quick Reference - Table Structure:

### `pii_db.users`
- `id`, `email`, `username`, `hashed_password`, `role`, `is_active`, `is_locked`, `last_login`, `created_at`

### `pii_db.pii_records`
- `id`, `user_id`, `category`, `pii_type`, `type_label`, `encrypted_value`, `nonce`, `key_id`, `label`, `notes`, `expiry_date`, `last_accessed`, `access_count`, `created_at`

### `pii_db.login_attempts`
- `id`, `email`, `ip_address`, `user_agent`, `success`, `timestamp`

### `key_storage_db.field_keys`
- `id`, `key_id`, `wrapped_key`, `master_key_version`, `is_active`, `created_at`, `expires_at`

---

**Recommended:** Use the Python script (`python view_database.py`) for the easiest and cleanest view of your data! 📊
