# 🚀 SafeRide Dashboard - Quick Start Guide

Get your motorcycle violation detection dashboard running in **under 2 minutes**!

## ⚡ Fastest Way to Test (No Backend Required)

```bash
# 1. Install dependencies
npm install

# 2. Start the dashboard (already configured for mock data!)
npm run dev

# 3. Open browser
# Go to: http://localhost:5173

# 4. Login
# Username: admin
# Password: admin
```

✅ **Done!** You now have a fully functional dashboard with realistic mock data.

## 📋 What You Can Test

With mock data mode, you can explore:

✅ **Dashboard** - Real-time statistics and violation trends
✅ **Incidents** - List of violations with filters
✅ **Incident Detail** - Detailed violation view with images
✅ **Review Workflow** - Approve/Reject/Needs Info actions
✅ **Model Metrics** - YOLOv11 performance analytics
✅ **Reports** - Generate violation reports
✅ **Audit Logs** - Track user actions
✅ **Live Feed** - Camera feed simulation

## 🔄 Next Steps

### Option 1: Continue with Mock Data

Perfect for:
- UI/UX development
- Frontend testing
- Demonstrations
- Learning the system

Just keep using the dashboard as-is!

### Option 2: Connect to Python Backend

When ready to integrate YOLOv11:

**Terminal 1 - Start Backend:**
```bash
cd python-backend-starter
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Configure Frontend:**
```bash
# Edit .env.local
echo "VITE_USE_MOCK_DATA=false" > .env.local
echo "VITE_API_BASE_URL=http://localhost:8000" >> .env.local
echo "VITE_WS_BASE_URL=ws://localhost:8000" >> .env.local

# Restart frontend
npm run dev
```

## 📖 Documentation

1. **[README.md](./README.md)** - Project overview and features
2. **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Frontend-backend integration
3. **[PYTHON_BACKEND_API.md](./PYTHON_BACKEND_API.md)** - Complete API specification
4. **[python-backend-starter/README.md](./python-backend-starter/README.md)** - Backend setup

## 🎯 Key Features

### Dashboard
- Live violation feed
- Real-time statistics
- Trend visualization
- Camera status monitoring

### Violations
- Filter by status/type/location
- Search by ID or plate number
- Multi-image evidence view
- Confidence scores

### Review System
- Approve violations
- Reject false positives
- Request more info
- Add reviewer notes
- Automatic audit logging

### Analytics
- Model performance metrics
- Accuracy/Precision/Recall
- Inference time tracking
- Confidence distribution

## 🔧 Configuration

The dashboard is pre-configured for mock data in `.env.local`:

```bash
VITE_USE_MOCK_DATA=true          # Use mock data
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

## 🐛 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Change port in package.json or kill process
npx kill-port 5173
npm run dev
```

### Backend connection fails
1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `.env.local` has correct URLs
3. Check browser console for CORS errors
4. Switch back to mock mode: `VITE_USE_MOCK_DATA=true`

## 📱 Default Login

**Username:** `admin`
**Password:** `admin`

> ⚠️ Change these credentials in production!

## 🎨 System Architecture

```
Your Browser (http://localhost:5173)
         ↓
   React Dashboard
         ↓
    Mock Data  OR  Python Backend (http://localhost:8000)
                        ↓
                   PostgreSQL DB
                        ↓
                   YOLOv11 Model
                        ↓
                   CCTV Cameras
```

## ✅ Checklist

- [x] Node.js installed (v18+)
- [x] `npm install` completed
- [x] Dashboard running on `http://localhost:5173`
- [x] Can login with `admin/admin`
- [x] See violations in dashboard
- [ ] Python backend running (optional)
- [ ] Connected to real database (optional)
- [ ] YOLOv11 integrated (optional)

## 🚀 You're Ready!

Start exploring the dashboard and customize it for your research needs.

**Happy coding! 🎉**

---

**Need Help?**
- Check the [Integration Guide](./INTEGRATION_GUIDE.md)
- Review the [API Documentation](./PYTHON_BACKEND_API.md)
- Open the browser console (F12) for errors
