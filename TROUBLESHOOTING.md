# SafeRide Dashboard - Troubleshooting Guide

## Common Issues and Solutions

### 🔌 WebSocket Connection Errors

**Error:** `WebSocket error: { "isTrusted": true }`

**Cause:** The dashboard is trying to connect to a WebSocket server that isn't running.

**Solution:**

This is **completely normal** when using mock data mode! The WebSocket errors are harmless warnings.

#### Option 1: Continue with Mock Data (Recommended for Development)

The dashboard works perfectly fine with mock data - WebSocket is optional.

```bash
# Verify .env.local has:
VITE_USE_MOCK_DATA=true
```

The error messages in the console are just informational and won't affect functionality.

#### Option 2: Start the Python Backend

If you want real-time WebSocket updates:

```bash
# Terminal 1 - Start Python backend
cd python-backend-starter
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 - Configure frontend for backend
cat > .env.local << EOF
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
EOF

# Restart frontend
npm run dev
```

#### What the WebSocket Does

- ✅ **With Backend:** Receives real-time violation updates without page refresh
- ✅ **Without Backend (Mock Mode):** Dashboard still fully functional, just no live updates

---

### 🔑 Login Issues

**Issue:** Can't login or getting authentication errors

**Solution:**

Default credentials (mock mode):
```
Username: admin
Password: admin
```

If using the Python backend, make sure:
1. Backend is running: `curl http://localhost:8000/health`
2. CORS is configured correctly in backend
3. `.env.local` has `VITE_USE_MOCK_DATA=false`

---

### 📡 API Connection Errors

**Error:** `Failed to fetch` or `Network error`

**Check:**

1. Is backend running?
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"healthy"}
   ```

2. Is `.env.local` configured correctly?
   ```bash
   cat .env.local
   # Should show correct API URLs
   ```

3. Is CORS enabled in backend?
   ```python
   # In Python backend main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

**Quick Fix:** Switch to mock mode
```bash
echo "VITE_USE_MOCK_DATA=true" > .env.local
npm run dev
```

---

### 🎨 UI Not Loading / Blank Page

**Cause:** Package installation or build issues

**Solution:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

---

### 📦 Module Not Found Errors

**Error:** `Cannot find module '@/app/...'`

**Solution:**

The `@` alias is configured in `vite.config.ts`. Make sure:

1. All packages are installed: `npm install`
2. TypeScript server is running (in VS Code: Cmd+Shift+P → "Restart TS Server")
3. No syntax errors in files

---

### 🚀 Port Already in Use

**Error:** `Port 5173 is already in use`

**Solution:**

```bash
# Kill the process using the port
npx kill-port 5173

# Or use a different port
npm run dev -- --port 3000
```

---

### 🐍 Python Backend Won't Start

**Error:** `ModuleNotFoundError` or import errors

**Solution:**

```bash
# Make sure virtual environment is activated
cd python-backend-starter
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt

# Run backend
uvicorn main:app --reload --port 8000
```

**Check it's running:**
```bash
curl http://localhost:8000/
# Should return: {"message":"SafeRide API","version":"1.0.0","status":"running"}
```

---

### 📊 Charts Not Displaying

**Issue:** Recharts not showing data

**Check:**

1. Data is loading: Open browser console (F12) and check for errors
2. Window is wide enough: Charts are responsive
3. Mock data is enabled: `VITE_USE_MOCK_DATA=true`

---

### 🔐 JWT Token Expired

**Error:** `401 Unauthorized` after some time

**Solution:**

Tokens expire after 7 days (configurable in backend). Just login again.

```typescript
// Frontend automatically handles this
// Just go to login page and sign in again
```

---

### 🌐 CORS Errors

**Error:** `Access to fetch at '...' has been blocked by CORS policy`

**Solution:**

In your Python backend `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "http://localhost:3000",
        # Add your production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 🖼️ Images Not Loading

**Issue:** Violation images show broken links

**In Mock Mode:** Images use Unsplash URLs and should work
**In Production:** Configure image storage in backend:
- S3
- MinIO
- Local filesystem

---

### 🔄 Data Not Refreshing

**Issue:** Dashboard shows stale data

**Solutions:**

1. **Auto-refresh:** Dashboard refreshes every 30 seconds automatically
2. **Manual refresh:** Reload the page (Cmd+R / Ctrl+R)
3. **WebSocket:** Enable WebSocket for instant updates (requires backend)

---

### 📱 Responsive Issues

**Issue:** Dashboard looks broken on mobile

**Note:** Dashboard is optimized for desktop/tablet use by LGU personnel.

For mobile:
- Scroll horizontally if needed
- Rotate to landscape mode
- Use pinch-to-zoom

---

## Debug Mode

Enable verbose logging:

**Browser Console (F12):**
```javascript
// Check WebSocket status
localStorage.getItem('access_token')  // Should show JWT token

// Check environment
console.log(import.meta.env)
```

**Check API calls:**
- Open Network tab in browser DevTools
- Watch API requests and responses
- Check for 4xx/5xx errors

---

## Environment Verification

Run this checklist:

```bash
# ✅ Node.js version
node --version  # Should be v18 or higher

# ✅ Dependencies installed
ls node_modules  # Should have many folders

# ✅ Environment file exists
cat .env.local

# ✅ Dev server starts
npm run dev  # Should start without errors

# ✅ Backend health (if using)
curl http://localhost:8000/health
```

---

## Still Having Issues?

### Check These Files:

1. **`.env.local`** - Environment configuration
2. **`src/app/services/api.ts`** - API integration
3. **`src/app/services/websocket.ts`** - WebSocket service
4. **Browser Console (F12)** - Error messages

### Test in Mock Mode First:

```bash
# Always test with mock data first
echo "VITE_USE_MOCK_DATA=true" > .env.local
npm run dev

# This should work 100% without any backend
```

### Clean Slate:

```bash
# Nuclear option - reset everything
rm -rf node_modules package-lock.json .env.local
npm install
cp .env.example .env.local
npm run dev
```

---

## Getting Help

1. **Check Documentation:**
   - [README.md](./README.md) - Overview
   - [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Backend integration
   - [PYTHON_BACKEND_API.md](./PYTHON_BACKEND_API.md) - API spec

2. **Browser Console:**
   - Press F12
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Backend Logs:**
   - Check Python backend terminal output
   - Look for error messages

---

## Common Console Messages (Normal)

These messages are **normal** and can be ignored:

✅ `WebSocket disabled - using mock data mode`
✅ `WebSocket closed - backend may not be running (this is OK in mock mode)`
✅ `WebSocket connection error (this is normal if backend is not running)`

These indicate you're in mock mode, which is perfectly fine for development!

---

## Performance Tips

### Slow Dashboard:

1. **Disable WebSocket retries** (if not using backend):
   - Already handled automatically in mock mode

2. **Reduce refresh interval:**
   ```typescript
   // In Dashboard.tsx
   const interval = setInterval(() => {
     loadDashboardData();
   }, 60000); // Change from 30000 to 60000 (1 minute)
   ```

3. **Limit violation list:**
   ```typescript
   // In Incidents.tsx
   const violations = await api.violations.getViolations({ 
     page_size: 10  // Reduce from 20 to 10
   });
   ```

---

**Last Updated:** 2024-02-25
**Dashboard Version:** 1.0.0
