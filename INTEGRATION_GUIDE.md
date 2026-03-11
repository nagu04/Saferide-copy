# SafeRide Dashboard - Python Backend Integration Guide

## Overview

This React dashboard is designed to work with a Python FastAPI backend for the SafeRide motorcycle violation detection system. The frontend handles all UI/UX while the backend processes YOLOv11 detections and manages data persistence.

## Architecture

```
┌─────────────────────────────────────────┐
│   React Frontend (This Dashboard)      │
│   - User Interface                      │
│   - Real-time Updates via WebSocket    │
│   - API Integration Layer               │
└──────────────┬──────────────────────────┘
               │
               │ HTTP/REST & WebSocket
               │
┌──────────────▼──────────────────────────┐
│   Python FastAPI Backend                │
│   - Authentication (JWT)                │
│   - Violation Management                │
│   - Real-time WebSocket Server          │
│   - YOLOv11 Integration                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   PostgreSQL / MongoDB Database         │
│   - Violations                          │
│   - Users                               │
│   - Audit Logs                          │
│   - Cameras                             │
└─────────────────────────────────────────┘
```

## Quick Start

### 1. Frontend Setup (This Dashboard)

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# For development with mock data (no backend required)
echo "VITE_USE_MOCK_DATA=true" > .env.local

# Start development server
npm run dev
```

The dashboard will run on `http://localhost:5173`

### 2. Backend Setup (Python FastAPI)

See `PYTHON_BACKEND_API.md` for complete API specification.

**Minimal Python Backend Example:**

```bash
# Create Python project
mkdir saferide-backend
cd saferide-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic python-jose[cryptography] passlib[bcrypt] python-multipart websockets

# Create main.py (see example below)
# Run server
uvicorn main:app --reload --port 8000
```

### 3. Connect Frontend to Backend

Once your Python backend is running:

```bash
# Update .env.local
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000

# Restart frontend
npm run dev
```

## File Structure

```
/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── api.ts              # Main API service layer
│   │   │   ├── mockData.ts         # Mock data for development
│   │   │   └── websocket.ts        # WebSocket client
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript type definitions
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Main dashboard (uses API)
│   │   │   ├── Login.tsx           # Login page (uses API)
│   │   │   ├── Incidents.tsx       # Violation list
│   │   │   ├── IncidentDetail.tsx  # Violation detail
│   │   │   └── ...
│   │   └── App.tsx
│   └── ...
├── .env.example                     # Environment template
├── PYTHON_BACKEND_API.md           # Complete API specification
├── INTEGRATION_GUIDE.md            # This file
└── package.json
```

## Key Features

### 1. Mock Data Mode

Perfect for frontend development without a backend:

```typescript
// .env.local
VITE_USE_MOCK_DATA=true
```

The dashboard will use realistic mock data defined in `src/app/services/mockData.ts`.

### 2. API Service Layer

All API calls go through `src/app/services/api.ts`:

```typescript
import { api } from '@/app/services/api';

// Authentication
await api.auth.login({ username, password });
await api.auth.logout();

// Violations
const violations = await api.violations.getViolations({ status: 'pending' });
const detail = await api.violations.getViolation('VIO-2024-001');
await api.violations.reviewViolation({
  violation_id: 'VIO-2024-001',
  decision: 'approve',
  reviewer_notes: 'Clear violation'
});

// Dashboard
const stats = await api.dashboard.getStats();
const trends = await api.dashboard.getTrends(6);
const recent = await api.dashboard.getRecentViolations(10);

// Analytics
const metrics = await api.analytics.getMetrics();

// Reports
const report = await api.reports.generateReport({
  report_type: 'daily',
  date_from: '2024-02-25T00:00:00Z',
  date_to: '2024-02-25T23:59:59Z'
});
```

### 3. Real-time Updates

WebSocket integration for live violation updates:

```typescript
import { useWebSocket } from '@/app/services/websocket';

function MyComponent() {
  const { isConnected } = useWebSocket((message) => {
    if (message.type === 'new_violation') {
      console.log('New violation detected:', message.data);
      // Update UI
    }
  });

  return <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>;
}
```

### 4. TypeScript Types

All data structures are typed in `src/app/types/index.ts`:

```typescript
import type { Violation, ViolationStatus, User } from '@/app/types';

const violation: Violation = {
  id: 'VIO-2024-001',
  timestamp: '2024-02-25T14:32:05.124Z',
  location: 'Sucat Main Gate',
  // ... fully typed
};
```

## Python Backend Requirements

Your Python backend must implement these endpoints:

### Authentication
- `POST /api/auth/login` - User login, returns JWT token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Violations
- `GET /api/violations` - List violations (with filters/pagination)
- `GET /api/violations/{id}` - Get violation detail
- `POST /api/violations/{id}/review` - Submit review decision

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/trends` - Get trend data
- `GET /api/dashboard/recent` - Get recent violations

### Analytics
- `GET /api/analytics/metrics` - Model performance metrics
- `GET /api/analytics/location-stats` - Location statistics

### Reports
- `POST /api/reports/generate` - Generate report
- `GET /api/reports` - List reports

### Audit
- `GET /api/audit/logs` - Get audit logs

### WebSocket
- `WS /ws/violations` - Real-time updates

See `PYTHON_BACKEND_API.md` for complete specifications with request/response examples.

## YOLOv11 Integration

When your YOLOv11 model detects a violation:

```python
# Your YOLOv11 detection loop
async def process_camera_feed(camera_id: str):
    cap = cv2.VideoCapture(stream_url)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Run YOLOv11 inference
        results = model(frame)
        
        # Process detections
        for detection in results:
            if is_violation(detection):
                # Create violation record in database
                violation = create_violation(
                    camera_id=camera_id,
                    frame=frame,
                    detections=detection
                )
                
                # Broadcast to all connected WebSocket clients
                await websocket_manager.broadcast({
                    "type": "new_violation",
                    "timestamp": violation.timestamp.isoformat(),
                    "data": violation.dict()
                })
```

## Database Schema

See `PYTHON_BACKEND_API.md` for complete PostgreSQL schema.

Key tables:
- `users` - User accounts and roles
- `violations` - Violation records
- `audit_logs` - Action audit trail
- `cameras` - Camera information

## Deployment

### Production Frontend

```bash
# Build for production
npm run build

# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - Your web server
```

### Production Backend

```bash
# Run with Gunicorn + Uvicorn workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or use Docker
docker build -t saferide-backend .
docker run -p 8000:8000 saferide-backend
```

### Environment Variables (Production)

**Frontend (.env.production):**
```
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=https://api.saferide.gov.ph
VITE_WS_BASE_URL=wss://api.saferide.gov.ph
```

**Backend:**
```
DATABASE_URL=postgresql://user:pass@localhost/saferide
JWT_SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=https://dashboard.saferide.gov.ph
```

## Testing

### Frontend Only (Mock Mode)

```bash
VITE_USE_MOCK_DATA=true npm run dev
```

Test all features without backend:
- Login (any username/password works)
- Dashboard statistics
- Violation list and detail
- Review workflow
- Reports
- Audit logs

### With Backend

```bash
# Terminal 1: Start Python backend
cd saferide-backend
uvicorn main:app --reload

# Terminal 2: Start frontend
VITE_USE_MOCK_DATA=false npm run dev
```

## Common Issues

### CORS Errors

Make sure your Python backend has CORS configured:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### WebSocket Connection Failed

1. Check `VITE_WS_BASE_URL` is correct
2. Ensure backend WebSocket endpoint is running
3. Check browser console for errors

### Authentication Issues

1. Check JWT token is being sent: `Authorization: Bearer <token>`
2. Verify token expiration
3. Check user permissions

## Security Considerations

⚠️ **Important:**

1. **Never commit `.env.local`** - It contains sensitive configuration
2. **Use HTTPS in production** - Required for secure WebSocket (WSS)
3. **Implement rate limiting** - Prevent API abuse
4. **Validate all inputs** - Backend must validate all data
5. **Audit all actions** - Log user actions for accountability
6. **No PII collection** - Do not store rider personal information
7. **Watermark images** - Mark all violation images appropriately

## Support

For issues or questions:

1. Check `PYTHON_BACKEND_API.md` for API specification
2. Review TypeScript types in `src/app/types/index.ts`
3. Examine mock data examples in `src/app/services/mockData.ts`
4. Test with mock mode first: `VITE_USE_MOCK_DATA=true`

## License

This dashboard is part of the SafeRide research project on real-time motorcycle violation detection using YOLOv11.
