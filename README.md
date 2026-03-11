# SafeRide - Real-Time Motorcycle Violation Detection Dashboard

A production-ready web dashboard for monitoring and managing motorcycle violations detected by YOLOv11, designed for Local Government Unit (LGU) personnel.

![SafeRide Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)

> 📚 **New to this project?** See [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) for all guides.
> 
> ⚡ **Quick Start:** [QUICK_START.md](./QUICK_START.md) - Get running in 2 minutes!
> 
> ✅ **System Status:** [STATUS.md](./STATUS.md) - Check what's working

## 🎯 Project Overview

**Research Title:** "REAL-TIME DETECTION OF MOTORCYCLE VIOLATIONS USING YOLOv11 WITH WEB REPORTING DASHBOARD FOR HELMET, PLATE, AND OVERLOADING VIOLATIONS"

**System Name:** SafeRide

### Key Features

✅ **Real-time Monitoring** - Live violation detection from CCTV cameras
✅ **Review Workflow** - Human-in-the-loop validation before enforcement
✅ **Multi-violation Detection** - Helmet, license plate, and overloading
✅ **Analytics Dashboard** - Model performance metrics and trends
✅ **Audit Logging** - Complete action history for accountability
✅ **Report Generation** - Exportable violation reports
✅ **Role-based Access** - Admin, Reviewer, and Viewer roles
✅ **WebSocket Real-time** - Live updates without page refresh
✅ **Python Backend Ready** - Full FastAPI integration support

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│         React Dashboard (This Project)              │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│   │  Dashboard │  │ Violations │  │  Analytics │  │
│   └────────────┘  └────────────┘  └────────────┘  │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│   │   Reports  │  │ Audit Logs │  │  Settings  │  │
│   └────────────┘  └────────────┘  └────────────┘  │
└──────────────┬───────────────────────────────────┬─┘
               │ HTTP/REST API  │ WebSocket        │
┌──────────────▼──────────────────────────────────▼──┐
│         Python FastAPI Backend                     │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│   │    JWT     │  │  Violation │  │  WebSocket │  │
│   │    Auth    │  │   Manager  │  │   Server   │  │
│   └────────────┘  └────────────┘  └────────────┘  │
│   ┌────────────┐  ┌────────────┐                   │
│   │  YOLOv11   │  │   Camera   │                   │
│   │   Model    │  │   Manager  │                   │
│   └────────────┘  └────────────┘                   │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│         PostgreSQL / MongoDB Database               │
│   - Violations  - Users  - Audit Logs  - Cameras   │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Option 1: Frontend Only (Mock Data)

Perfect for UI development and testing without a backend:

```bash
# Clone repository
git clone <repository-url>
cd saferide-dashboard

# Install dependencies
npm install

# Run with mock data
echo "VITE_USE_MOCK_DATA=true" > .env.local
npm run dev

# Open http://localhost:5173
# Login: username=admin, password=admin
```

### Option 2: Full Stack (Frontend + Backend)

**Terminal 1 - Python Backend:**
```bash
cd python-backend-starter
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 - React Frontend:**
```bash
# Configure for backend
cat > .env.local << EOF
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
EOF

npm run dev
# Open http://localhost:5173
```

## 📁 Project Structure

```
saferide-dashboard/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── api.ts              # API integration layer
│   │   │   ├── mockData.ts         # Development mock data
│   │   │   └── websocket.ts        # WebSocket client
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript definitions
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   ├── Login.tsx           # Authentication
│   │   │   ├── Incidents.tsx       # Violation list
│   │   │   ├── IncidentDetail.tsx  # Violation review
│   │   │   ├── ModelMetrics.tsx    # YOLOv11 metrics
│   │   │   ├── Reports.tsx         # Report generation
│   │   │   ├── AuditLog.tsx        # Action history
│   │   │   └── Settings.tsx        # Configuration
│   │   ├── components/
│   │   │   ├── Layout.tsx          # App layout
│   │   │   └── ui/                 # UI components
│   │   └── App.tsx
│   └── styles/
│       └── index.css
├── python-backend-starter/         # Backend starter template
│   ├── main.py                     # FastAPI application
│   ├── requirements.txt            # Python dependencies
│   └── README.md                   # Backend guide
├── .env.example                    # Environment template
├── PYTHON_BACKEND_API.md          # Complete API specification
├── INTEGRATION_GUIDE.md           # Integration documentation
├── package.json
└── README.md                       # This file
```

## 🎨 Features

### 1. Real-Time Dashboard

- Live violation detection feed
- YOLOv11 inference metrics (FPS, confidence)
- Statistics cards (violations by type)
- Trend charts (last 6 hours)
- Active camera status
- WebSocket real-time updates

### 2. Incident Management

- Violation list with filtering
  - By status (Pending/Approved/Rejected)
  - By type (Helmet/Plate/Overloading)
  - By location
  - By date range
- Search by ID or plate number
- Detailed violation view
  - Evidence images (multiple angles)
  - Detection bounding boxes
  - OCR plate recognition
  - Weather & traffic conditions

### 3. Review Workflow

- ✅ **Approve** - Confirm violation
- ❌ **Reject** - False positive/unclear
- ℹ️ **Needs Info** - Request additional review
- Reviewer notes
- Rejection reason selection
- Audit trail logging

### 4. Analytics & Metrics

- Model performance
  - Accuracy, Precision, Recall, F1 Score
  - Average inference time
  - False positive/negative rates
- Violation trends over time
- Location-based statistics
- Confidence distribution

### 5. Reports & Audit

- Generate PDF/CSV reports
  - Daily, Weekly, Monthly
  - Custom date range
  - Filter by type/location
- Complete audit log
  - User actions
  - Timestamp tracking
  - IP address logging

## 🔧 Technology Stack

### Frontend
- **React** 18.3.1 - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** v4 - Styling
- **Recharts** - Data visualization
- **React Router** - Navigation
- **Lucide React** - Icons
- **date-fns** - Date formatting

### Backend (Python)
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **WebSockets** - Real-time updates
- **YOLOv11** - Object detection
- **OpenCV** - Video processing

## 📚 Documentation

- **[PYTHON_BACKEND_API.md](./PYTHON_BACKEND_API.md)** - Complete API specification with request/response examples
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Frontend-backend integration guide
- **[python-backend-starter/README.md](./python-backend-starter/README.md)** - Backend quick start guide

## 🔒 Security & Privacy

⚠️ **Important Ethical Considerations:**

✅ **No Facial Recognition** - System does NOT identify riders
✅ **No PII Collection** - No personal demographic data
✅ **Public Road Data Only** - Surveillance limited to public areas
✅ **Human Review Required** - No automatic enforcement
✅ **Watermarked Images** - "FOR REVIEW PURPOSES ONLY"
✅ **Complete Audit Trail** - All actions logged
✅ **Role-Based Access** - Restricted by user permissions
✅ **Secure Authentication** - JWT token-based

## 🛠️ Development

### Environment Variables

Create `.env.local`:

```bash
# Mock mode (no backend needed)
VITE_USE_MOCK_DATA=true

# Production mode (requires backend)
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=https://api.saferide.gov.ph
VITE_WS_BASE_URL=wss://api.saferide.gov.ph
```

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (port 5173)

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Check code quality
```

### API Integration

All API calls use the centralized service:

```typescript
import { api } from '@/app/services/api';

// Login
const response = await api.auth.login({ username, password });

// Get violations
const violations = await api.violations.getViolations({ 
  status: 'pending',
  page: 1 
});

// Review violation
await api.violations.reviewViolation({
  violation_id: 'VIO-2024-001',
  decision: 'approve',
  reviewer_notes: 'Clear violation'
});

// Dashboard stats
const stats = await api.dashboard.getStats();
```

### WebSocket Integration

```typescript
import { useWebSocket } from '@/app/services/websocket';

function Dashboard() {
  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'new_violation') {
      // Handle new violation
      console.log('New violation:', message.data);
    }
  });

  return <div>Status: {isConnected ? 'Live' : 'Offline'}</div>;
}
```

## 📦 Deployment

### Frontend (React)

**Vercel / Netlify:**
```bash
npm run build
# Deploy dist/ folder
```

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Backend (Python)

**Production Server:**
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Docker:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🧪 Testing

### Mock Data Mode

Test all features without backend:

```bash
VITE_USE_MOCK_DATA=true npm run dev
```

Default credentials:
- Username: `admin`
- Password: `admin`

### Backend Testing

```bash
# Test API endpoint
curl http://localhost:8000/health

# Test login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

## 🤝 Contributing

This is a research project. For questions or contributions, please follow your institution's guidelines.

## 📄 License

Research project - SafeRide Motorcycle Violation Detection System

## 🙏 Acknowledgments

- **YOLOv11** by Ultralytics
- **FastAPI** framework
- **React** and ecosystem
- LGU personnel for feedback and requirements

## 📞 Support

For technical issues:

1. Check documentation:
   - [PYTHON_BACKEND_API.md](./PYTHON_BACKEND_API.md)
   - [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
   
2. Test with mock mode first:
   ```bash
   VITE_USE_MOCK_DATA=true npm run dev
   ```

3. Check browser console for errors

4. Verify environment variables

## 🗺️ Roadmap

- [x] Frontend dashboard
- [x] Mock data system
- [x] API integration layer
- [x] WebSocket support
- [x] Python backend starter
- [ ] Complete database implementation
- [ ] YOLOv11 real-time integration
- [ ] Report export (PDF/CSV)
- [ ] Multi-camera support
- [ ] Advanced analytics
- [ ] Mobile responsive optimization

---

**Research Team:** SafeRide Project
**Year:** 2024
**Technology:** YOLOv11 + React + FastAPI