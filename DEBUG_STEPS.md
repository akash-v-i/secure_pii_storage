# Debug Steps for "Can't Navigate to PII Vault" Issue

## Immediate Checks:

### 1. Check if Backend is Running
Open a new terminal and run:
```bash
cd backend
python main.py
```

If it says "port already in use", backend is running. If it starts the server, keep it running.

### 2. Check Browser Console (F12)
Look for these errors:
- Network errors when accessing `/auth/me`
- CORS errors
- 401 Unauthorized errors

### 3. Check localStorage
In browser console (F12 → Console tab), type:
```javascript
localStorage.getItem('access_token')
```

**Expected:** Should return a long string (JWT token)
**If null/empty:** You need to login again

### 4. Test API Manually
In browser, go to: `http://localhost:8080/docs`

If you see the API documentation, backend is running.
If you get "can't connect", backend is not running.

### 5. Verify You're Actually Logged In
Check browser console for authentication errors when page loads.

## Most Common Issues:

### Issue 1: Backend Not Running
**Solution:** Start backend server
```bash
cd backend
python main.py
```

### Issue 2: Token Expired
**Solution:** Clear localStorage and login again
```javascript
// In browser console
localStorage.clear()
// Then go to /login and login again
```

### Issue 3: CORS Error
**Check:** `backend/main.py` - CORS_ORIGINS should include `http://localhost:5173`

### Issue 4: Wrong API URL
**Check:** Frontend expects backend at `http://localhost:8080`
**Verify:** Check `src/lib/api.ts` - API_BASE_URL

## Quick Fix:

1. **Restart everything:**
   - Stop backend (Ctrl+C if running)
   - Start backend: `cd backend && python main.py`
   - Restart frontend: `npm run dev`
   - Clear browser localStorage
   - Login again with: `admin@vault.com` / `Admin123!`

2. **If still not working:**
   - Check browser console for specific errors
   - Check backend terminal for errors
   - Share the error messages you see
