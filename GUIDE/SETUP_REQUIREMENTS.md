# SECURE-VAULT - Setup Requirements & Instructions

## 📋 What I've Created

I've set up the complete FastAPI backend structure for your SECURE-VAULT project:

### Backend Structure Created:
```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── env.example            # Environment variables template
├── init_db.py             # Database initialization script
├── db/                    # Database models and sessions
│   ├── session.py        # Dual database connection management
│   ├── pii_db.py         # PII database models (Users, PIIRecords, LoginAttempts, etc.)
│   └── key_db.py         # Key storage models (FieldKeys)
├── routes/                # API endpoints
│   ├── auth.py           # Authentication routes (login, register, logout)
│   ├── vault.py          # PII data operations (store, retrieve, update, delete)
│   └── admin.py          # Admin functionality (user management, audit logs)
├── services/             # Business logic
│   └── crypto_service.py # AES-GCM encryption/decryption service
└── utils/                # Helper utilities
    ├── jwt_handler.py    # JWT token creation/validation
    ├── key_management.py # Encryption key handling
    ├── validation.py     # Input sanitization and validation
    └── logger.py         # Logging configuration
```

## 🔧 What You Need to Provide

To complete the setup, I need the following from you:

### 1. **MySQL Database Access** ⚠️ REQUIRED
   - MySQL username (default: `root`)
   - MySQL password
   - MySQL host (default: `localhost`)
   - MySQL port (default: `3306`)

### 2. **Environment Configuration** ⚠️ REQUIRED
   - Copy `backend/env.example` to `backend/.env`
   - Update the following values:
     ```env
     MYSQL_USER=your_mysql_username
     MYSQL_PASSWORD=your_mysql_password
     MYSQL_HOST=localhost
     MYSQL_PORT=3306
     SECRET_KEY=your-very-secure-secret-key-min-32-chars
     ```

### 3. **Optional but Recommended**
   - **reCAPTCHA Secret Key** (for production registration)
   - **Email SMTP settings** (for password reset functionality)
   - **Azure Key Vault** credentials (for production key management)

## 🚀 Setup Instructions

### Step 1: Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Configure Environment
```bash
# Copy the example environment file
copy env.example .env  # Windows
# OR
cp env.example .env    # Linux/Mac

# Edit .env with your MySQL credentials
```

### Step 3: Initialize Database
```bash
# Make sure MySQL is running
python init_db.py
```

This will:
- Create `pii_db` database
- Create `key_storage_db` database
- Create all necessary tables
- Create default admin user: `admin@vault.com` / `Admin123!`

### Step 4: Start Backend Server
```bash
# Development mode (auto-reload)
python main.py

# OR using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

Backend will run on: `http://localhost:8080`
API docs available at: `http://localhost:8080/docs`

## 📝 API Endpoints Created

### Authentication (`/auth`)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login (returns JWT token)
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user info

### Vault (`/api/vault`)
- `POST /api/vault/store` - Store encrypted PII
- `GET /api/vault/list` - List all PII records (masked)
- `GET /api/vault/retrieve/{id}` - Retrieve and decrypt PII
- `PUT /api/vault/update/{id}` - Update PII record
- `DELETE /api/vault/delete/{id}` - Delete PII record

### Admin (`/api/admin`)
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users/{id}/role` - Update user role (admin only)
- `GET /api/admin/audit` - Security audit logs (admin only)
- `GET /api/admin/statistics` - System statistics (admin only)

## 🔄 Next Steps - Frontend Integration

### 1. Install Frontend Dependencies
```bash
# In project root (not backend folder)
npm install jwt-decode axios
```

### 2. Update Frontend Configuration
- Create API service/utility for making HTTP requests to backend
- Update `AuthContext.tsx` to use API endpoints instead of localStorage
- Update PII store to fetch from backend API
- Add axios interceptors for JWT token management

### 3. Update Vite Config for CORS
The backend CORS is already configured, but ensure frontend runs on port 5173 (default Vite port).

## ⚠️ Important Notes

1. **Encryption Keys**: The current implementation uses a master key derived from `SECRET_KEY`. For production, consider using Azure Key Vault.

2. **DEK Storage**: Currently, each PII record stores its DEK wrapped in the keys database. The encryption flow needs refinement for production.

3. **CAPTCHA**: Currently uses a simple "secure" check. Replace with Google reCAPTCHA for production.

4. **Session Management**: JWT tokens are stateless. Tokens expire after 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).

5. **Password Reset**: OTP functionality is partially implemented but requires email service configuration.

## 🐛 Known Issues to Fix

1. **Encryption Flow**: The `store_pii` endpoint needs to properly handle DEK generation and storage. Currently, there's a logic issue that needs refinement.

2. **Key Retrieval**: When retrieving PII, the key lookup logic needs to be verified.

3. **Frontend Integration**: Frontend still uses localStorage - needs to be migrated to API calls.

## 📞 What I Need From You Now

Please provide:
1. ✅ **MySQL credentials** (username, password, host, port)
2. ✅ **Confirmation** if you want to use default database names (`pii_db` and `key_storage_db`) or custom ones
3. ✅ **Any specific configuration** for your environment
4. ✅ **Preference** on whether to proceed with frontend integration now or test backend first

Once you provide MySQL access, I can:
- Test database connection
- Initialize databases and tables
- Verify all endpoints work
- Update frontend to connect to backend

Let me know what you'd like to do next! 🚀
