# Database Setup Instructions

## ⚠️ MySQL Configuration Required

The database initialization script attempted to run but requires your **MySQL password**.

### What You Need to Do:

1. **Edit `backend/.env` file** and update the MySQL password:

   ```env
   MYSQL_PASSWORD=your_actual_mysql_password
   ```

   Replace `your_actual_mysql_password` with your actual MySQL root password.

2. **If you don't know your MySQL password:**
   - Check if MySQL is installed and running
   - Try connecting with MySQL Workbench or command line
   - If no password is set, leave it empty: `MYSQL_PASSWORD=`

3. **If MySQL is not installed:**
   - Download MySQL: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP/WAMP which includes MySQL

### After Updating Password:

Run the initialization script again:

```bash
cd backend
python init_db.py
```

### Alternative: Manual Database Creation

If you prefer to create databases manually:

1. **Connect to MySQL:**
   ```bash
   mysql -u root -p
   ```

2. **Create databases:**
   ```sql
   CREATE DATABASE IF NOT EXISTS pii_db;
   CREATE DATABASE IF NOT EXISTS key_storage_db;
   ```

3. **Run initialization:**
   ```bash
   cd backend
   python init_db.py
   ```

The script will:
- Verify databases exist
- Create all tables
- Create default admin user

---

**Current Status:**
- ✅ `.env` file created
- ✅ SECRET_KEY generated
- ⏳ MySQL password needed
- ⏳ Database initialization pending
