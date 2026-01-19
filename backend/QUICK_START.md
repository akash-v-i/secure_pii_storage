# Quick Start Guide

## 🚀 Fast Setup (3 Steps)

### 1. Create `.env` file

```bash
cd backend
copy env.example .env
```

Edit `.env` and set:
- `MYSQL_PASSWORD` = your MySQL password
- `SECRET_KEY` = generate one with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

### 2. Initialize Database

```bash
python init_db.py
```

### 3. Start Server

```bash
python main.py
```

✅ Backend running on **http://localhost:8080**

## 🧪 Quick Test

Open in browser: **http://localhost:8080/docs**

Login with:
- Email: `admin@vault.com`
- Password: `Admin123!`

---

For detailed setup, see `BACKEND_SETUP_GUIDE.md`
