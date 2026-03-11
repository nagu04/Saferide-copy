# SafeRide Python FastAPI Backend - API Specification

This document specifies the exact API endpoints your Python FastAPI backend needs to implement for the SafeRide dashboard to work correctly.

## Technology Stack

- **Framework**: FastAPI (Python 3.9+)
- **Database**: PostgreSQL or MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: WebSockets
- **Image Storage**: S3, MinIO, or local filesystem
- **Video Processing**: OpenCV + YOLOv11

## Base URL

Development: `http://localhost:8000`
Production: `https://api.saferide.gov.ph`

## Authentication

All endpoints (except `/api/auth/login`) require JWT authentication.

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Authentication

#### POST `/api/auth/login`

Login and receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-001",
    "username": "admin",
    "email": "admin@saferide.gov.ph",
    "role": "admin",
    "full_name": "Admin User",
    "created_at": "2024-01-01T00:00:00Z",
    "is_active": true
  }
}
```

**Python Example:**
```python
from fastapi import FastAPI, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str
    username: str
    email: str
    role: str
    full_name: str
    created_at: datetime
    is_active: bool

@app.post("/api/auth/login")
async def login(credentials: LoginRequest):
    # Verify credentials against database
    user = authenticate_user(credentials.username, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token_data = {
        "sub": user.id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
```

#### POST `/api/auth/logout`

Logout user (invalidate token).

**Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

#### GET `/api/auth/me`

Get current authenticated user info.

**Response (200):**
```json
{
  "id": "user-001",
  "username": "admin",
  "email": "admin@saferide.gov.ph",
  "role": "admin",
  "full_name": "Admin User",
  "created_at": "2024-01-01T00:00:00Z",
  "is_active": true
}
```

---

### 2. Violations

#### GET `/api/violations`

Get paginated list of violations with filters.

**Query Parameters:**
- `status` (optional): `pending` | `approved` | `rejected` | `needs_info`
- `violation_type` (optional): `no_helmet` | `no_plate` | `overloading` | `expired_registration`
- `location` (optional): Location filter
- `date_from` (optional): ISO 8601 datetime
- `date_to` (optional): ISO 8601 datetime
- `search_query` (optional): Search by ID or plate number
- `page` (optional, default: 1)
- `page_size` (optional, default: 20)

**Response (200):**
```json
{
  "violations": [
    {
      "id": "VIO-2024-001",
      "timestamp": "2024-02-25T14:32:05.124Z",
      "location": "Sucat Main Gate",
      "camera_id": "CAM-001",
      "detections": [
        {
          "type": "no_helmet",
          "confidence": 0.94,
          "bounding_box": {
            "x": 120,
            "y": 80,
            "width": 150,
            "height": 200
          }
        }
      ],
      "plate_data": {
        "plate_number": "ABC 1234",
        "ocr_confidence": 0.98,
        "is_registered": true,
        "is_expired": false,
        "registration_expiry_date": "2024-12-31"
      },
      "passenger_count": 1,
      "weather_condition": "sunny",
      "traffic_level": "moderate",
      "image_urls": [
        "https://storage.saferide.gov.ph/violations/VIO-2024-001/img1.jpg"
      ],
      "status": "pending",
      "suggested_fine": 1500,
      "model_version": "YOLOv11n-v1.0",
      "fps": 24,
      "reviewed_by": null,
      "reviewed_at": null,
      "reviewer_notes": null,
      "rejection_reason": null
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5
}
```

**Python Example:**
```python
from typing import Optional
from sqlalchemy.orm import Session

@app.get("/api/violations")
async def get_violations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = None,
    violation_type: Optional[str] = None,
    location: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search_query: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
):
    query = db.query(Violation)
    
    # Apply filters
    if status:
        query = query.filter(Violation.status == status)
    if violation_type:
        # Filter by detection type (requires JSON query)
        pass
    if location:
        query = query.filter(Violation.location.contains(location))
    if date_from:
        query = query.filter(Violation.timestamp >= date_from)
    if date_to:
        query = query.filter(Violation.timestamp <= date_to)
    if search_query:
        query = query.filter(
            (Violation.id.contains(search_query)) |
            (Violation.plate_number.contains(search_query))
        )
    
    # Pagination
    total = query.count()
    violations = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "violations": violations,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
```

#### GET `/api/violations/{id}`

Get single violation detail.

**Response (200):**
```json
{
  "id": "VIO-2024-001",
  "timestamp": "2024-02-25T14:32:05.124Z",
  "location": "Sucat Main Gate",
  ...
}
```

#### POST `/api/violations/{id}/review`

Submit review decision for a violation.

**Request Body:**
```json
{
  "violation_id": "VIO-2024-001",
  "decision": "approve",
  "reviewer_notes": "Clear violation visible in all frames",
  "rejection_reason": null
}
```

**Response (200):**
```json
{
  "id": "VIO-2024-001",
  "status": "approved",
  "reviewed_by": "Admin User",
  "reviewed_at": "2024-02-25T15:00:00Z",
  "reviewer_notes": "Clear violation visible in all frames",
  ...
}
```

**Python Example:**
```python
class ReviewDecision(BaseModel):
    violation_id: str
    decision: str  # approve | reject | needs_info
    reviewer_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

@app.post("/api/violations/{id}/review")
async def review_violation(
    id: str,
    decision: ReviewDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    violation = db.query(Violation).filter(Violation.id == id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")
    
    # Update violation
    if decision.decision == "approve":
        violation.status = "approved"
    elif decision.decision == "reject":
        violation.status = "rejected"
        violation.rejection_reason = decision.rejection_reason
    else:
        violation.status = "needs_info"
    
    violation.reviewed_by = current_user.full_name
    violation.reviewed_at = datetime.utcnow()
    violation.reviewer_notes = decision.reviewer_notes
    
    db.commit()
    
    # Create audit log entry
    create_audit_log(current_user.id, "REVIEW_VIOLATION", violation.id, decision.dict())
    
    return violation
```

---

### 3. Dashboard

#### GET `/api/dashboard/stats`

Get dashboard statistics.

**Response (200):**
```json
{
  "total_violations_today": 44,
  "helmet_violations": 24,
  "plate_violations": 12,
  "overloading_violations": 8,
  "pending_review_count": 15,
  "approved_count": 22,
  "rejected_count": 7,
  "active_cameras": 4,
  "total_cameras": 4,
  "average_confidence": 0.923
}
```

#### GET `/api/dashboard/trends`

Get violation trends over time.

**Query Parameters:**
- `hours` (optional, default: 6): Number of hours to look back

**Response (200):**
```json
[
  {
    "timestamp": "2024-02-25T08:00:00Z",
    "helmet_count": 4,
    "plate_count": 2,
    "overload_count": 1
  },
  {
    "timestamp": "2024-02-25T09:00:00Z",
    "helmet_count": 7,
    "plate_count": 3,
    "overload_count": 0
  }
]
```

#### GET `/api/dashboard/recent`

Get recent violations.

**Query Parameters:**
- `limit` (optional, default: 10)

**Response (200):**
```json
[
  {
    "id": "VIO-2024-001",
    "timestamp": "2024-02-25T14:32:05Z",
    "location": "Sucat Main Gate",
    "detections": [...],
    ...
  }
]
```

---

### 4. Analytics

#### GET `/api/analytics/metrics`

Get YOLOv11 model performance metrics.

**Response (200):**
```json
{
  "model_version": "YOLOv11n-v1.0",
  "total_detections": 1247,
  "accuracy_rate": 0.94,
  "precision": 0.92,
  "recall": 0.89,
  "f1_score": 0.905,
  "average_inference_time_ms": 23.4,
  "false_positive_rate": 0.08,
  "false_negative_rate": 0.11,
  "detections_by_type": {
    "no_helmet": 645,
    "no_plate": 412,
    "overloading": 190
  },
  "confidence_distribution": [
    {
      "range": "0.90-1.00",
      "count": 892
    }
  ]
}
```

#### GET `/api/analytics/location-stats`

Get statistics by location.

**Response (200):**
```json
[
  {
    "location": "Sucat Main Gate",
    "camera_id": "CAM-001",
    "violation_count": 342,
    "average_confidence": 0.93
  }
]
```

---

### 5. Reports

#### POST `/api/reports/generate`

Generate a new report.

**Request Body:**
```json
{
  "report_type": "daily",
  "date_from": "2024-02-25T00:00:00Z",
  "date_to": "2024-02-25T23:59:59Z",
  "include_images": false,
  "violation_types": ["no_helmet", "no_plate"],
  "locations": ["Sucat Main Gate"]
}
```

**Response (200):**
```json
{
  "id": "RPT-2024-001",
  "generated_at": "2024-02-25T16:00:00Z",
  "generated_by": "Admin User",
  "report_type": "daily",
  "period": {
    "start": "2024-02-25T00:00:00Z",
    "end": "2024-02-25T23:59:59Z"
  },
  "summary": {
    "total_violations": 44,
    "by_type": {
      "no_helmet": 24,
      "no_plate": 12,
      "overloading": 8
    },
    "by_status": {
      "pending": 15,
      "approved": 22,
      "rejected": 7
    },
    "by_location": {
      "Sucat Main Gate": 18
    }
  },
  "download_url": "/api/reports/download/RPT-2024-001"
}
```

#### GET `/api/reports`

List all generated reports.

**Response (200):**
```json
[
  {
    "id": "RPT-2024-001",
    ...
  }
]
```

---

### 6. Audit Logs

#### GET `/api/audit/logs`

Get audit logs.

**Query Parameters:**
- `page` (optional, default: 1)
- `page_size` (optional, default: 50)

**Response (200):**
```json
{
  "logs": [
    {
      "id": "LOG-001",
      "timestamp": "2024-02-25T14:35:12Z",
      "user_id": "user-001",
      "user_name": "Admin User",
      "action": "APPROVE_VIOLATION",
      "entity_type": "violation",
      "entity_id": "VIO-2024-002",
      "details": {
        "previous_status": "pending",
        "new_status": "approved"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0..."
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 50
}
```

---

### 7. Cameras

#### GET `/api/cameras`

Get all cameras.

**Response (200):**
```json
[
  {
    "id": "CAM-001",
    "name": "Sucat Main Gate",
    "location": "Sucat Main Gate",
    "status": "online",
    "stream_url": "rtsp://localhost:8554/cam1",
    "last_heartbeat": "2024-02-25T14:35:00Z",
    "fps": 24,
    "resolution": "1920x1080"
  }
]
```

---

### 8. WebSocket

#### WS `/ws/violations`

Real-time violation updates via WebSocket.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/violations');

ws.onopen = () => {
  // Send auth token
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your_jwt_token'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

**Message Types:**

1. **New Violation:**
```json
{
  "type": "new_violation",
  "timestamp": "2024-02-25T14:32:05Z",
  "data": {
    "id": "VIO-2024-001",
    ...
  }
}
```

2. **Violation Updated:**
```json
{
  "type": "violation_updated",
  "timestamp": "2024-02-25T14:35:00Z",
  "data": {
    "violation_id": "VIO-2024-001",
    "status": "approved",
    "reviewed_by": "Admin User"
  }
}
```

3. **Camera Status:**
```json
{
  "type": "camera_status",
  "timestamp": "2024-02-25T14:00:00Z",
  "data": {
    "camera_id": "CAM-001",
    "status": "offline"
  }
}
```

**Python WebSocket Example:**
```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/violations")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive messages from client (e.g., auth)
            data = await websocket.receive_json()
            
            if data.get("type") == "auth":
                # Verify token
                token = data.get("token")
                user = verify_token(token)
                if not user:
                    await websocket.close(code=1008)
                    return
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# When new violation is detected by YOLOv11:
async def on_new_violation(violation):
    await manager.broadcast({
        "type": "new_violation",
        "timestamp": datetime.utcnow().isoformat(),
        "data": violation.dict()
    })
```

---

## Database Schema (PostgreSQL)

### users
```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### violations
```sql
CREATE TABLE violations (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    camera_id VARCHAR(50) NOT NULL,
    detections JSONB NOT NULL,
    plate_data JSONB,
    passenger_count INTEGER,
    weather_condition VARCHAR(50),
    traffic_level VARCHAR(50),
    image_urls TEXT[],
    status VARCHAR(20) DEFAULT 'pending',
    suggested_fine DECIMAL(10,2),
    model_version VARCHAR(50),
    fps INTEGER,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    reviewer_notes TEXT,
    rejection_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violations_status ON violations(status);
CREATE INDEX idx_violations_timestamp ON violations(timestamp);
CREATE INDEX idx_violations_camera ON violations(camera_id);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
```

### cameras
```sql
CREATE TABLE cameras (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'offline',
    stream_url VARCHAR(512),
    last_heartbeat TIMESTAMP,
    fps INTEGER,
    resolution VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## YOLOv11 Integration

When your YOLOv11 model detects a violation:

```python
async def process_yolo_detection(frame, detections, camera_id):
    """
    Called when YOLOv11 detects a violation
    """
    # Create violation record
    violation = Violation(
        id=generate_violation_id(),
        timestamp=datetime.utcnow(),
        location=get_camera_location(camera_id),
        camera_id=camera_id,
        detections=[
            {
                "type": detection.violation_type,
                "confidence": detection.confidence,
                "bounding_box": detection.bbox
            }
            for detection in detections
        ],
        plate_data=extract_plate_data(frame, detections),
        passenger_count=count_passengers(detections),
        weather_condition=get_weather(),
        traffic_level=assess_traffic(frame),
        image_urls=save_violation_images(frame, detections),
        status="pending",
        suggested_fine=calculate_fine(detections),
        model_version="YOLOv11n-v1.0",
        fps=24
    )
    
    # Save to database
    db.add(violation)
    db.commit()
    
    # Broadcast via WebSocket
    await websocket_manager.broadcast({
        "type": "new_violation",
        "timestamp": violation.timestamp.isoformat(),
        "data": violation.dict()
    })
```

---

## Error Handling

All errors should return this format:

```json
{
  "detail": "Error message here",
  "status_code": 400,
  "error_code": "INVALID_REQUEST"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

---

## CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://dashboard.saferide.gov.ph"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Testing

Use the frontend with mock data first:
```bash
# In the React app
VITE_USE_MOCK_DATA=true npm run dev
```

Then connect to your backend:
```bash
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
npm run dev
```
