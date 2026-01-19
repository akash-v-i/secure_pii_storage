# Hosting & Production Deployment Guide

If you are experiencing "Network Error" or authentication issues when hosting the PII Vault, it is likely due to mismatched API URLs or CORS configurations. Follow this guide to fix it.

## 1. Frontend Configuration (Vite)

When you host the frontend (e.g., on Vercel, Netlify, or a VPS), the browser needs to know where your backend is located.

### The Problem
By default, the frontend points to `http://localhost:8080`. When hosted, `localhost` refers to the *user's* computer, not your server.

### The Fix
You must set the `VITE_API_URL` environment variable **at build time**.

**If using Vercel/Netlify:**
1. Go to your Project Settings -> Environment Variables.
2. Add `VITE_API_URL` with the value of your backend URL (e.g., `https://api.yourdomain.com`).
3. Redeploy the project.

**If building manually:**
```bash
# Windows (PowerShell)
$env:VITE_API_URL="https://api.yourdomain.com"; npm run build

# Linux/Mac
VITE_API_URL="https://api.yourdomain.com" npm run build
```

---

## 2. Backend Configuration (FastAPI)

The backend must allow requests from your frontend's domain (CORS).

### The Fix
Update your backend `.env` file:

```env
# Replace with your actual frontend URL (no trailing slash)
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:5173

# Ensure the backend binds to 0.0.0.0 to be accessible externally
# This is usually handled in main.py or your production runner (gunicorn/uvicorn)
```

---

## 3. Mixed Content Issues (HTTP vs HTTPS)

If your frontend is on **HTTPS** (required by most hosting providers), your backend **MUST** also be on **HTTPS**. Browsers will block requests from an HTTPS site to an HTTP API (Mixed Content Error).

### The Fix
1. Use a tool like **Nginx** or **Traefik** as a reverse proxy to provide SSL (HTTPS).
2. Or use a service like **Cloudflare** to manage SSL.
3. If using **Render/Railway**, they provide HTTPS URLs automatically.

---

## 4. Database Setup

Ensure your production database (MySQL) is accessible by the backend.

1. Update `MYSQL_HOST`, `MYSQL_USER`, and `MYSQL_PASSWORD` in `backend/.env`.
2. If the database is on the same server, `MYSQL_HOST=localhost` is usually fine.
3. If using a managed database, use the provided connection string.

---

## 5. Troubleshooting Steps

1. **Check Browser Console (F12)**:
   - If you see `ERR_CONNECTION_REFUSED`, the `VITE_API_URL` is wrong or the backend is down.
   - If you see `CORS Error`, the `CORS_ORIGINS` in the backend doesn't match your frontend URL.
   - If you see `Mixed Content`, your API is using `http` instead of `https`.

2. **Test API Directly**:
   - Try visiting `https://your-backend-api.com/health` in your browser. It should return `{"status":"healthy", ...}`.

3. **Check Backend Logs**:
   - Look for error messages in your backend terminal/logs if connections are reaching it but failing (e.g., database connection errors).
