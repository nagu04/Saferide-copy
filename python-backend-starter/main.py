from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
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
    "CAM-001": "rtsp://cpe25detection:coponluceshofilena123@112.207.185.219:8554/stream2",
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
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ==================== Violations ====================

@app.get("/api/violations")
async def get_violations(current_user: User = Depends(get_current_user)):
    return {"violations": MOCK_VIOLATIONS}

@app.post("/api/detections")
async def receive_detection(data: dict):
    violation = {
        "id": f"VIO-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "timestamp": datetime.now().isoformat(),
        "location": data.get("location", "Unknown"),
        "camera_id": data.get("camera_id"),
        "detections": data.get("detections"),
        "status": "pending"
    }
    MOCK_VIOLATIONS.insert(0, violation)
    await manager.broadcast({"type": "new_violation", "data": violation})
    return {"status": "received"}

# ==================== Dashboard ====================

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    return DashboardStats(
        total_violations_today=len(MOCK_VIOLATIONS),
        helmet_violations=10,
        plate_violations=5,
        overloading_violations=3,
        pending_review_count=4,
        approved_count=6,
        rejected_count=1,
        active_cameras=len(MOCK_CAMERAS),
        total_cameras=len(MOCK_CAMERAS),
        average_confidence=0.92
    )

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
def camera_feed(camera_id: str, current_user: User = Depends(get_current_user)):
    stream = get_camera_stream(camera_id)
    return StreamingResponse(gen_frames(stream),
                             media_type='multipart/x-mixed-replace; boundary=frame')

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