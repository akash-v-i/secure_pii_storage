# Backend Setup Guide

## ✅ Dependencies Installed

All Python dependencies have been installed successfully!

## 📋 Next Steps

### Step 1: Configure Environment Variables

1. **Copy the example environment file:**
   ```bash
   cd backend
   copy env.example .env
   ```
   (On Linux/Mac: `cp env.example .env`)

2. **Edit `.env` file** with your MySQL credentials:
   ```env
   MYSQL_USER=root
   MYSQL_PASSWORD=your_actual_password
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE_PII=pii_db
   MYSQL_DATABASE_KEYS=key_storage_db
   
   SECRET_KEY=change-this-to-a-secure-random-string-min-32-characters
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   CORS_ORIGINS=http://localhost:5173,http://localhost:8080
   ```

   **⚠️ Important:** 
   - Replace `your_actual_password` with your MySQL root password
   - Replace `SECRET_KEY` with a secure random string (minimum 32 characters)
   - You can generate a secret key using: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

### Step 2: Ensure MySQL is Running

Make sure MySQL server is installed and running on your system.

**Windows:**
- Check Services (services.msc) for "MySQL" service
- Or use MySQL Workbench to verify connection

**Linux/Mac:**
```bash
sudo systemctl status mysql
# OR
sudo service mysql status
```

### Step 3: Initialize Database

Run the database initialization script:

```bash
cd backend
python init_db.py
```

This will:
- ✅ Create `pii_db` database
- ✅ Create `key_storage_db` database  
- ✅ Create all required tables (Users, PIIRecords, LoginAttempts, FieldKeys)
- ✅ Create default admin user: `admin@vault.com` / `Admin123!`

**Expected Output:**
```
Initializing SECURE-VAULT databases...
--------------------------------------------------
✓ Database 'pii_db' created/verified
✓ Database 'key_storage_db' created/verified
✓ PII database tables created
✓ Keys database tables created
✓ Default admin user created: admin@vault.com / Admin123!
--------------------------------------------------
✓ Database initialization complete!
```

### Step 4: Start Backend Server

```bash
cd backend
python main.py
```

**OR using uvicorn directly:**

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

The backend will start on: **http://localhost:8080**

### Step 5: Verify Backend is Running

1. **Health Check:**
   ```bash
   curl http://localhost:8080/
   ```
   Should return: `{"status":"ok","message":"SECURE-VAULT API is running","version":"1.0.0"}`

2. **API Documentation:**
   Open in browser: **http://localhost:8080/docs**
   - Interactive API documentation (Swagger UI)
   - Test endpoints directly

## 🔧 Troubleshooting

### MySQL Connection Error

**Error:** `(2003, "Can't connect to MySQL server on 'localhost'")`

**Solution:**
- Ensure MySQL server is running
- Check MySQL credentials in `.env` file
- Verify MySQL port (default: 3306)

### Database Already Exists

**Error:** `(1007, "Can't create database 'pii_db'; database exists")`

**Solution:** This is normal! The script uses `CREATE DATABASE IF NOT EXISTS`, so existing databases won't cause issues.

### Port Already in Use

**Error:** `Address already in use`

**Solution:**
- Another process is using port 8080
- Change port in `.env` or `main.py`
- Or stop the other process

### Import Errors

**Error:** `ModuleNotFoundError`

**Solution:**
- Ensure you're in the `backend` directory when running scripts
- Verify all dependencies are installed: `pip list`
- Reinstall if needed: `pip install -r requirements.txt`

## 🎯 Testing the Backend

### Test Registration Endpoint

```bash
curl -X POST "http://localhost:8080/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test1234!\",\"username\":\"Test User\"}"
```

### Test Login Endpoint

```bash
curl -X POST "http://localhost:8080/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@vault.com\",\"password\":\"Admin123!\",\"captcha\":\"secure\"}"
```

### Using API Documentation

The easiest way to test is using the interactive docs at:
**http://localhost:8080/docs**

## 📝 Default Credentials

After initialization, you can login with:

- **Email:** `admin@vault.com`
- **Password:** `Admin123!`
- **Role:** Admin

## 🚀 Next Steps

Once backend is running:

1. **Start Frontend:**
   ```bash
   npm run dev
   ```

2. **Test Full Integration:**
   - Open frontend: http://localhost:5173
   - Login with admin credentials
   - Test PII storage and retrieval

## 📚 Additional Resources

- FastAPI Docs: https://fastapi.tiangolo.com/
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
- MySQL Docs: https://dev.mysql.com/doc/

---

**Backend Setup Complete! 🎉**
