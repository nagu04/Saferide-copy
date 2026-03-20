"""
SafeRide Backend - FastAPI Starter Template

This is a minimal working example to get you started.
Expand this with your YOLOv11 integration and database models.

Installation:
    pip install fastapi uvicorn sqlalchemy pydantic python-jose[cryptography] passlib[bcrypt] python-multipart websockets

Run:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import cv2
from fastapi.responses import StreamingResponse
from typing import Dict
import threading
import os
import subprocess
import signal
import numpy as np

# ==================== Configuration ====================

SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
FFMPEG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ffmpeg", "bin", "ffmpeg.exe"))

# ==================== FastAPI App ====================

app = FastAPI(title="SafeRide API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ==================== Models ====================

class LoginRequest(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: str
    username: str
    email: str
    role: str
    full_name: str
    created_at: str
    is_active: bool

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class ViolationDetection(BaseModel):
    type: str
    confidence: float
    bounding_box: Optional[dict] = None

class PlateData(BaseModel):
    plate_number: Optional[str] = None
    ocr_confidence: float = 0.0
    is_registered: bool = False
    is_expired: bool = False
    registration_expiry_date: Optional[str] = None

class Violation(BaseModel):
    id: str
    timestamp: str
    location: str
    camera_id: str
    detections: List[ViolationDetection]
    plate_data: Optional[PlateData] = None
    passenger_count: int
    weather_condition: str
    traffic_level: str
    image_urls: List[str]
    status: str
    suggested_fine: float
    model_version: str
    fps: int
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewer_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class ReviewDecision(BaseModel):
    violation_id: str
    decision: str
    reviewer_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class DashboardStats(BaseModel):
    total_violations_today: int
    helmet_violations: int
    plate_violations: int
    overloading_violations: int
    pending_review_count: int
    approved_count: int
    rejected_count: int
    active_cameras: int
    total_cameras: int
    average_confidence: float

# ==================== Mock Database ====================

# In production, replace this with real database queries
MOCK_USER = {
    "id": "user-001",
    "username": "admin",
    "password_hash": pwd_context.hash("admin"),
    "email": "admin@saferide.gov.ph",
    "role": "admin",
    "full_name": "Admin User",
    "created_at": datetime.now().isoformat(),
    "is_active": True
}

MOCK_VIOLATIONS = [
    {
        "id": "VIO-2024-001",
        "timestamp": datetime.now().isoformat(),
        "location": "Sucat Main Gate",
        "camera_id": "CAM-001",
        "detections": [
            {
                "type": "no_helmet",
                "confidence": 0.94,
                "bounding_box": {"x": 120, "y": 80, "width": 150, "height": 200}
            }
        ],
        "plate_data": {
            "plate_number": "ABC 1234",
            "ocr_confidence": 0.98,
            "is_registered": True,
            "is_expired": False,
            "registration_expiry_date": "2024-12-31"
        },
        "passenger_count": 1,
        "weather_condition": "sunny",
        "traffic_level": "moderate",
        "image_urls": [
            "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200"
        ],
        "status": "pending",
        "suggested_fine": 1500.0,
        "model_version": "YOLOv11n-v1.0",
        "fps": 24,
        "reviewed_by": None,
        "reviewed_at": None,
        "reviewer_notes": None,
        "rejection_reason": None
    }
]

#CAMERA_CAPTURES: Dict[str, cv2.VideoCapture] = {}

# ==================== Helper Functions ====================
#import subprocess
#import asyncio





class FFMpegCameraStream:
    def __init__(self, rtsp_url, width=640, height=480, fps=20):
        self.rtsp_url = rtsp_url
        self.width = width
        self.height = height
        self.fps = fps
        self.process = None

    def start(self):
        if self.process is None:
            print(f"[INFO] Starting FFmpeg stream for {self.rtsp_url}")
            # Run FFmpeg to output raw video frames in BGR24
            self.process = subprocess.Popen(
                [
                    FFMPEG_PATH,
                    "-rtsp_transport", "tcp",  # use TCP for RTSP
                    "-i", self.rtsp_url,
                    "-f", "rawvideo",
                    "-pix_fmt", "bgr24",
                    "-s", f"{self.width}x{self.height}",
                    "-"
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=10**8
            )

    def get_frame(self):
        """Return a JPEG-encoded frame"""
        if self.process is None:
            self.start()
        try:
            raw_size = self.width * self.height * 3
            raw_frame = self.process.stdout.read(raw_size)
            if not raw_frame:
                return None
            frame = np.frombuffer(raw_frame, np.uint8).reshape((self.height, self.width, 3))
            ret, jpeg = cv2.imencode(".jpg", frame)
            if not ret:
                return None
            return jpeg.tobytes()
        except Exception as e:
            print(f"[ERROR] FFmpeg read failed: {e}")
            self.stop()
            return None

    def stop(self):
        if self.process:
            print(f"[INFO] Stopping FFmpeg stream for {self.rtsp_url}")
            self.process.terminate()
            self.process.wait()
            self.process = None

CAMERA_STREAMS: Dict[str, FFMpegCameraStream] = {}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # In production, fetch user from database
        if user_id == MOCK_USER["id"]:
            return User(**{k: v for k, v in MOCK_USER.items() if k != "password_hash"})
        
        raise HTTPException(status_code=404, detail="User not found")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

RTSP_URLS = {
    "CAM-001": "rtsp://cpe25detection:coponluceshofilena123@192.168.1.23:554/stream1",
}

def shutdown_handler(*args):
    print("[INFO] Shutting down camera streams...")
    for stream in CAMERA_STREAMS.values():
        stream.stop()
    print("[INFO] Done.")
    exit(0)

signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)


def get_camera_stream(camera_id: str):
    if camera_id not in RTSP_URLS:
        raise HTTPException(status_code=404, detail=f"Unknown camera ID: {camera_id}")

    if camera_id not in CAMERA_STREAMS:
        CAMERA_STREAMS[camera_id] = FFMpegCameraStream(RTSP_URLS[camera_id])

    return CAMERA_STREAMS[camera_id]

def gen_frames(camera_id: str):
    if camera_id not in RTSP_URLS:
        raise HTTPException(status_code=404, detail=f"Unknown camera ID: {camera_id}")

    if camera_id not in CAMERA_STREAMS:
        CAMERA_STREAMS[camera_id] = FFMpegCameraStream(RTSP_URLS[camera_id])

    stream = CAMERA_STREAMS[camera_id]
    stream.start()
    failure_count = 0

    while True:
        frame = stream.get_frame()
        if frame is None:
            failure_count += 1
            print(f"[WARN] Failed to read frame from {camera_id} ({failure_count})")
            if failure_count >= 5:
                print(f"[INFO] Restarting FFmpeg stream for {camera_id}")
                stream.stop()
                time.sleep(2)
                stream.start()
                failure_count = 0
            time.sleep(0.1)
            continue

        failure_count = 0
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
# ==================== Authentication Endpoints ====================

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """Login endpoint - returns JWT token"""
    
    # In production, fetch user from database
    if credentials.username != MOCK_USER["username"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, MOCK_USER["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token(data={"sub": MOCK_USER["id"]})
    
    user = User(**{k: v for k, v in MOCK_USER.items() if k != "password_hash"})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@app.post("/api/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout endpoint"""
    # In production, invalidate token (add to blacklist)
    return {"message": "Successfully logged out"}

@app.get("/api/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

# ==================== Violation Endpoints ====================

@app.get("/api/violations")
async def get_violations(
    status: Optional[str] = None,
    violation_type: Optional[str] = None,
    location: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get paginated violations with filters"""
    # In production, query database with filters
    violations = MOCK_VIOLATIONS.copy()
    
    # Apply filters
    if status:
        violations = [v for v in violations if v["status"] == status]
    
    if location:
        violations = [v for v in violations if location.lower() in v["location"].lower()]
    
    # Pagination
    total = len(violations)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = violations[start:end]
    
    return {
        "violations": paginated,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }

@app.get("/api/violations/{violation_id}")
async def get_violation(
    violation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get single violation detail"""
    # In production, query database
    for violation in MOCK_VIOLATIONS:
        if violation["id"] == violation_id:
            return violation
    
    raise HTTPException(status_code=404, detail="Violation not found")

@app.post("/api/violations/{violation_id}/review")
async def review_violation(
    violation_id: str,
    decision: ReviewDecision,
    current_user: User = Depends(get_current_user)
):
    """Submit review decision"""
    # In production, update database and create audit log
    for violation in MOCK_VIOLATIONS:
        if violation["id"] == violation_id:
            # Update status
            if decision.decision == "approve":
                violation["status"] = "approved"
            elif decision.decision == "reject":
                violation["status"] = "rejected"
                violation["rejection_reason"] = decision.rejection_reason
            else:
                violation["status"] = "needs_info"
            
            violation["reviewed_by"] = current_user.full_name
            violation["reviewed_at"] = datetime.now().isoformat()
            violation["reviewer_notes"] = decision.reviewer_notes
            
            return violation
    
    raise HTTPException(status_code=404, detail="Violation not found")

# ==================== Dashboard Endpoints ====================

@app.get("/camera-feed/{camera_id}")
async def camera_feed(camera_id: str):
    return StreamingResponse(
        gen_frames(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics"""
    # In production, calculate from database
    return DashboardStats(
        total_violations_today=44,
        helmet_violations=24,
        plate_violations=12,
        overloading_violations=8,
        pending_review_count=15,
        approved_count=22,
        rejected_count=7,
        active_cameras=4,
        total_cameras=4,
        average_confidence=0.923
    )

@app.get("/api/dashboard/trends")
async def get_dashboard_trends(
    hours: int = 6,
    current_user: User = Depends(get_current_user)
):
    """Get violation trends"""
    # In production, query database
    import random
    trends = []
    now = datetime.now()
    
    for i in range(hours + 1):
        time = now - timedelta(hours=hours - i)
        trends.append({
            "timestamp": time.isoformat(),
            "helmet_count": random.randint(3, 12),
            "plate_count": random.randint(1, 6),
            "overload_count": random.randint(0, 4)
        })
    
    return trends

@app.get("/api/dashboard/recent")
async def get_recent_violations(
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Get recent violations"""
    # In production, query database
    return MOCK_VIOLATIONS[:limit]

# ==================== WebSocket ====================

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
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws/violations")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            
            # Handle authentication
            if data.get("type") == "auth":
                # In production, verify JWT token
                pass
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ==================== YOLOv11 Integration Hook ====================

async def on_yolo_detection(camera_id: str, frame, detections):
    """
    Call this function when YOLOv11 detects a violation
    
    This will:
    1. Create violation record in database
    2. Broadcast to all WebSocket clients
    """
    # Create violation
    violation = {
        "id": f"VIO-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "timestamp": datetime.now().isoformat(),
        "location": f"Camera {camera_id}",
        "camera_id": camera_id,
        "detections": detections,
        # ... add other fields
        "status": "pending"
    }
    
    # Save to database (in production)
    MOCK_VIOLATIONS.insert(0, violation)
    
    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "new_violation",
        "timestamp": violation["timestamp"],
        "data": violation
    })

# ==================== Health Check ====================

@app.get("/")
async def root():
    return {
        "message": "SafeRide API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
