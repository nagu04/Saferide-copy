from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

# ==================== Configuration ====================

SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# ==================== FastAPI App ====================

app = FastAPI(title="SafeRide API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for now (Render + React)
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

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

# ==================== Violations ====================

@app.get("/api/violations")
async def get_violations(current_user: User = Depends(get_current_user)):
    return {"violations": MOCK_VIOLATIONS}

@app.post("/api/detections")
async def receive_detection(data: dict):
    """
    This endpoint will be called by your PC YOLO detection script
    """
    violation = {
        "id": f"VIO-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "timestamp": datetime.now().isoformat(),
        "location": data.get("location", "Unknown"),
        "camera_id": data.get("camera_id"),
        "detections": data.get("detections"),
        "status": "pending"
    }

    MOCK_VIOLATIONS.insert(0, violation)

    await manager.broadcast({
        "type": "new_violation",
        "data": violation
    })

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
        active_cameras=1,
        total_cameras=1,
        average_confidence=0.92
    )

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

# ==================== Health ====================

@app.get("/")
async def root():
    return {"message": "SafeRide API running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}