# Troubleshooting Authentication Issues

## Issue: Can't navigate to PII Vault page - redirects to login

### Possible Causes:

1. **Backend Server Not Running**
   - Check if backend is running on port 8080
   - Start backend: `cd backend && python main.py`

2. **Token Expired or Invalid**
   - Clear browser localStorage and login again
   - Open DevTools (F12) → Application → Local Storage → Clear `access_token`

3. **CORS Issues**
   - Check browser console for CORS errors
   - Verify backend CORS settings in `backend/main.py`

4. **API Connection Failed**
   - Check browser console for network errors
   - Verify API URL: `http://localhost:8080`

### Debugging Steps:

1. **Check Browser Console (F12)**
   - Look for errors when navigating to `/vault`
   - Check Network tab for failed API calls

2. **Verify Backend is Running**
   ```bash
   # Test backend health
   curl http://localhost:8080/health
   # OR visit in browser
   http://localhost:8080/docs
   ```

3. **Check Authentication State**
   - Open DevTools → Console
   - Type: `localStorage.getItem('access_token')`
   - Should return a JWT token string

4. **Test API Endpoint Manually**
   - Open browser console
   - Navigate to http://localhost:8080/docs
   - Try the `/auth/me` endpoint with your token

### Quick Fix:

1. **Clear localStorage and re-login:**
   ```javascript
   // In browser console
   localStorage.clear();
   // Then navigate to /login and login again
   ```

2. **Restart Backend:**
   ```bash
   cd backend
   python main.py
   ```

3. **Check Backend Logs:**
   - Look for errors in the terminal where backend is running
   - Check for database connection issues

### Common Error Messages:

- **"Network Error"** → Backend not running or wrong URL
- **"401 Unauthorized"** → Token expired or invalid
- **"CORS error"** → Backend CORS configuration issue
- **"Cannot connect"** → Backend server not accessible
