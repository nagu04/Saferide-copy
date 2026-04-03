from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from random import randint, uniform
import jwt
from passlib.context import CryptContext
import cv2
import threading
import queue

# ==================== Configuration ====================

SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# RTSP URLs for your cameras
RTSP_URLS = {
    "CAM-001": "rtsp://cpe25detection:coponluceshofilena123@192.168.1.23:554/stream2",
}

# ==================== FastAPI App ====================

app = FastAPI(title="SafeRide API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class Violation(BaseModel):
    id: str
    timestamp: str
    location: str
    camera_id: str
    detections: List[ViolationDetection]
    status: str

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

class Camera(BaseModel):
    id: str
    name: str
    location: str

# ==================== Mock Database ====================

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

MOCK_VIOLATIONS = []

MOCK_AUDIT_LOGS = []

MOCK_CAMERAS = [
    {"id": "CAM-001", "name": "Main Gate", "location": "Sucat Main Gate"},
]

# ==================== Helper Functions ====================

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
        if user_id == MOCK_USER["id"]:
            return User(**{k: v for k, v in MOCK_USER.items() if k != "password_hash"})
        raise HTTPException(status_code=401, detail="Invalid token")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    
async def add_audit_log(action, user="system", details="", log_type="system", ip="unknown"):
    log = {
        "id": f"LOG-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
        "action": action,
        "user": user,
        "details": details,
        "type": log_type,
        "ip": ip,
        "timestamp": datetime.now().isoformat()
    }

    MOCK_AUDIT_LOGS.insert(0, log)

    # realtime push to frontend
    await manager.broadcast_all({
        "type": "audit_log",
        "data": log
    })

# ==================== Authentication ====================

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    if credentials.username != MOCK_USER["username"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(credentials.password, MOCK_USER["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": MOCK_USER["id"]})
    user = User(**{k: v for k, v in MOCK_USER.items() if k != "password_hash"})
    return LoginResponse(access_token=access_token, token_type="bearer", user=user)

# ==================== WebSocket Manager ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections = []
        self.subscribers = {}  # incident_id -> list of websockets

    async def connect(self, websocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        for subs in self.subscribers.values():
            if websocket in subs:
                subs.remove(websocket)

    async def subscribe(self, websocket, incident_id):
        if incident_id not in self.subscribers:
            self.subscribers[incident_id] = []
        self.subscribers[incident_id].append(websocket)

    async def broadcast_incident(self, incident_id, message):
        if incident_id in self.subscribers:
            for ws in self.subscribers[incident_id]:
                await ws.send_json(message)

    async def broadcast_all(self, message):
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except:
                dead.append(ws)

        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("WebSocket connection attempt...")
    await manager.connect(websocket)
    print("WebSocket connected!")

    try:
        while True:
            data = await websocket.receive_json()
            print("WS received:", data)

            if data.get("type") == "subscribe":
                await manager.subscribe(websocket, data["incident_id"])

            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        print("WebSocket disconnected")
        manager.disconnect(websocket)

    except Exception as e:
        print("WebSocket error:", e)
        manager.disconnect(websocket)

# ==================== Violations ====================

@app.get("/api/violations")
async def get_violations(current_user: User = Depends(get_current_user)):
    # Return violations in the same structure your frontend expects
    return {
        "violations": MOCK_VIOLATIONS
    }

@app.get("/api/violations/{violation_id}")
async def get_violation_by_id(violation_id: str):
    for v in MOCK_VIOLATIONS:
        if v["id"] == violation_id:
            return v
    raise HTTPException(status_code=404, detail="Violation not found")

@app.post("/api/detections")
async def receive_detection(data: dict):
    violation = {
        "id": f"VIO-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
        "timestamp": data.get("timestamp", datetime.now().isoformat()),
        "location": data.get("location", "Unknown"),
        "camera_id": data.get("camera_id"),
        "context": data.get("context", {}),
        "detections": [
            {
                "type": det.get("type"),
                "confidence": det.get("confidence"),
                "image_url": det.get("image_url"),
                "plate_number": det.get("plate_number"),
                "bounding_box": None
            }
            for det in data.get("detections", [])
        ],
        "status": "pending"
    }
    
    MOCK_VIOLATIONS.insert(0, violation)
    
    # 🔔 Real-time notification to subscribed clients
    await manager.broadcast_all({
        "type": "new_violation",
        "data": violation
    })

    await add_audit_log(
        action="NEW VIOLATION DETECTED",
        user="AI System",
        details=f"Violation {violation['id']} detected at {violation['location']}",
        log_type="system"
    )
    
    return {"status": "received", "violation": violation}

# ==================== Violation Decisions ====================

class DecisionRequest(BaseModel):
    action: str
    reviewerNote: Optional[str] = None


@app.post("/api/violations/{violation_id}/decision")
async def decide_violation(
    violation_id: str,
    decision: DecisionRequest,
    current_user: User = Depends(get_current_user)
):
    # Find violation
    violation = None
    for v in MOCK_VIOLATIONS:
        if v["id"] == violation_id:
            violation = v
            break

    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    # Update status based on action
    if decision.action == "approve":
        violation["status"] = "approved"
    elif decision.action == "reject":
        violation["status"] = "rejected"
    elif decision.action == "needsInfo":
        violation["status"] = "needs_info"
    elif decision.action == "reopen":
        violation["status"] = "pending"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    violation["reviewer_note"] = decision.reviewerNote
    violation["reviewed_by"] = current_user.full_name
    violation["reviewed_at"] = datetime.now().isoformat()

    await manager.broadcast_incident(
        violation_id,
        {
            "type": "update_violation",
            "data": violation
        }
    )

    await add_audit_log(
        action=f"{decision.action.upper()} VIOLATION",
        user=current_user.full_name,
        details=f"Violation {violation_id} marked as {violation['status']}",
        log_type="record"
    )

    return {
        "status": "success",
        "violation": violation
    }

# ==================== Dashboard ====================

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    # Count violations by type dynamically
    helmet_count = sum(
        1 for v in MOCK_VIOLATIONS for d in v["detections"] if d["type"] == "no_helmet"
    )
    plate_count = sum(
        1 for v in MOCK_VIOLATIONS for d in v["detections"] if d.get("plate_number")
    )
    overloading_count = sum(
        1 for v in MOCK_VIOLATIONS for d in v["detections"] if d["type"] == "overloading"
    )
    approved_count = sum(1 for v in MOCK_VIOLATIONS if v.get("status") == "approved")
    rejected_count = sum(1 for v in MOCK_VIOLATIONS if v.get("status") == "rejected")
    pending_count = sum(1 for v in MOCK_VIOLATIONS if v.get("status") == "pending")
    avg_conf = (
        sum(d["confidence"] for v in MOCK_VIOLATIONS for d in v["detections"]) /
        max(1, sum(len(v["detections"]) for v in MOCK_VIOLATIONS))
    )
    
    return DashboardStats(
        total_violations_today=len(MOCK_VIOLATIONS),
        helmet_violations=helmet_count,
        plate_violations=plate_count,
        overloading_violations=overloading_count,
        pending_review_count=pending_count,
        approved_count=approved_count,
        rejected_count=rejected_count,
        active_cameras=len(MOCK_CAMERAS),
        total_cameras=len(MOCK_CAMERAS),
        average_confidence=round(avg_conf, 2)
    )

@app.get("/api/dashboard/recent")
async def get_recent_violations(limit: int = 10, current_user: User = Depends(get_current_user)):
    return MOCK_VIOLATIONS[:limit]

@app.get("/api/audit/logs")
async def get_audit_logs(current_user: User = Depends(get_current_user)):
    return MOCK_AUDIT_LOGS

@app.get("/api/dashboard/trends")
async def get_trends(hours: int = 6, current_user: User = Depends(get_current_user)):
    """
    Return mock trend data for the past `hours`.
    Each entry represents a timestamp and number of violations detected.
    """
    now = datetime.utcnow()
    trends = []
    for i in range(hours):
        trends.append({
            "timestamp": (now - timedelta(hours=i)).isoformat(),
            "total_violations": randint(0, 5),
            "helmet_violations": randint(0, 3),
            "plate_violations": randint(0, 2),
            "overloading_violations": randint(0, 1)
        })
    return list(reversed(trends))  # oldest first
# ==================== Camera RTSP Streaming ====================

camera_streams: Dict[str, "FFMpegCameraStream"] = {}

class FFMpegCameraStream:
    def __init__(self, url: str):
        self.url = url
        self.cap = cv2.VideoCapture(url)
        self.frame_queue = queue.Queue(maxsize=10)
        self.thread = threading.Thread(target=self.update_frames, daemon=True)
        self.thread.start()

    def update_frames(self):
        while True:
            ret, frame = self.cap.read()
            if not ret:
                continue
            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                if self.frame_queue.full():
                    self.frame_queue.get()
                self.frame_queue.put(buffer.tobytes())

    def get_frame(self):
        try:
            return self.frame_queue.get(timeout=2)
        except queue.Empty:
            return None

def get_camera_stream(camera_id: str) -> FFMpegCameraStream:
    if camera_id not in RTSP_URLS:
        raise HTTPException(status_code=404, detail="Camera not found")
    if camera_id not in camera_streams:
        camera_streams[camera_id] = FFMpegCameraStream(RTSP_URLS[camera_id])
    return camera_streams[camera_id]

def gen_frames(stream: FFMpegCameraStream):
    while True:
        frame = stream.get_frame()
        if frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.get("/camera-feed/{camera_id}")
def camera_feed(camera_id: str):
    stream = get_camera_stream(camera_id)
    return StreamingResponse(
        gen_frames(stream),
        media_type='multipart/x-mixed-replace; boundary=frame'
    )

@app.get("/api/cameras", response_model=List[Camera])
async def get_cameras(current_user: User = Depends(get_current_user)):
    return MOCK_CAMERAS

# ==================== Health ====================

@app.get("/")
async def root():
    return {"message": "SafeRide API running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}