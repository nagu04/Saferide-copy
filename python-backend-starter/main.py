from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse, PlainTextResponse, FileResponse
from io import BytesIO, StringIO
from pydantic import BaseModel
from typing import List, Optional, Dict
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from datetime import datetime, timedelta, timezone
from random import randint, uniform
from passlib.context import CryptContext
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from openpyxl import Workbook
from jwt import PyJWTError
import cv2, csv, threading, queue, jwt, secrets
import numpy as np
import time, os

print(secrets.token_hex(32))
# ==================== Configuration ====================

SECRET_KEY = os.getenv("SECRET_KEY") or "dev-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# RTSP URLs for your cameras
RTSP_URLS = {
    "CAM-001": "rtsp://cpe25detection:coponluceshofilena123@192.168.1.23:554/stream2",
}

# ==================== FastAPI App ====================
app = FastAPI(title="SafeRide API", version="1.0.0")

FRONTEND_URLS = [
    "http://localhost:5173",                    # Dev
    "https://saferide-system.web.app",                # Firebase Hosting
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
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

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_code = Column(String(20), unique=True, nullable=False)
    location = Column(String(100), nullable=False)
    status = Column(String(20), default="offline")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    location = Column(String(100))
    violation_type = Column(String(50))
    status = Column(String(20), default="pending")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    image_url = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    reviewer_note = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, index=True)
    action = Column(String(100))
    user = Column(String(100))
    details = Column(Text)
    type = Column(String(50))
    ip = Column(String(50))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(50), primary_key=True)
    name = Column(String(255))
    user = Column(String(100))
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    size = Column(String(50))

class CameraResponse(BaseModel):
    id: int
    camera_code: str
    location: str
    status: str

    class Config:
        orm_mode = True

# ==================== Mock Database ====================

# ==================== Helper Functions ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        user = db.query(AdminUser).filter(AdminUser.id == int(user_id)).first()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        return User(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
            full_name=user.username,
            created_at=user.created_at.isoformat(),
            is_active=True
        )
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
async def add_audit_log(action, user="system", details="", log_type="system", ip="unknown", db: Session = None):
    log = AuditLog(
        id=f"LOG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
        action=action,
        user=user,
        details=details,
        type=log_type,
        ip=ip,
        timestamp=datetime.now(timezone.utc)
    )

    if db:
        db.add(log)
        db.commit()

    await manager.broadcast_all({
        "type": "audit_log",
        "data": {
            "id": log.id,
            "action": log.action,
            "user": log.user,
            "details": log.details,
            "type": log.type,
            "timestamp": log.timestamp.isoformat()
        }
    })

# ==================== Authentication ====================
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.username == credentials.username).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    try:
        valid = verify_password(credentials.password, user.password_hash)
    except Exception:
        raise HTTPException(status_code=500, detail="Corrupted password hash in DB")

    if not valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ✅ MISSING PART (THIS IS THE FIX)
    access_token = create_access_token(data={"sub": str(user.id)})

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=User(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
            full_name=user.username,
            created_at=user.created_at.isoformat(),
            is_active=True
        )
    )

# ==================== WebSocket Manager ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscribers: Dict[str, List[WebSocket]] = {}  # incident_id -> list of websockets

    def __del__(self):
        if self.cap.isOpened():
            self.cap.release()

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
        if websocket not in self.subscribers[incident_id]:
            self.subscribers[incident_id].append(websocket)

    async def broadcast_incident(self, incident_id, message):
        if incident_id in self.subscribers:
            for ws in self.subscribers[incident_id]:
                await ws.send_json(message)

    async def broadcast_all(self, message):
        for ws in list(self.active_connections):
            try:
                await ws.send_json(message)
            except Exception as e:
                print("WS send error:", e)
                self.disconnect(ws)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("WebSocket connection attempt...")
    await manager.connect(websocket)
    print("WebSocket connected!")

    authenticated = False

    try:
        while True:
            data = await websocket.receive_json()
            print("WS received:", data)

            if data.get("type") == "auth":
                token = data.get("token")
                try:
                    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    authenticated = True
                    print("WS Authenticated:", payload.get("sub"))

                    await websocket.send_json({
                        "type": "auth_success"
                    })
                except:
                    await websocket.close(code=1008)
            elif data.get("type") == "subscribe":
                if not authenticated:
                    await websocket.close(code=1008)
                    return

                incident_id = data.get("incident_id")
                await manager.subscribe(websocket, incident_id)

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
async def get_violations(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()

    return [
        {
            "id": i.id,
            "location": i.location,
            "violation_type": i.violation_type,
            "status": i.status,
            "timestamp": i.timestamp.isoformat()
        }
        for i in incidents
    ]

@app.get("/api/violations/{violation_id}")
async def get_violation_by_id(violation_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == violation_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Violation not found")

    return {
        "id": incident.id,
        "timestamp": incident.timestamp.isoformat(),
        "location": incident.location,
        "camera_id": incident.camera_id,
        "detections": [
            {
                "type": incident.violation_type,
                "confidence": 0.9,
                "image_url": incident.image_url
            }
        ],
        "status": incident.status
    }

@app.post("/api/detections")
async def receive_detection(data: dict, db: Session = Depends(get_db)):

    if not data.get("detections"):
        raise HTTPException(status_code=400, detail="No detections provided")
    violation = {
        "id": f"VIO-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
        "timestamp": data.get("timestamp", datetime.now(timezone.utc).isoformat()),
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
    camera = db.query(Camera).filter(Camera.camera_code == violation["camera_id"]).first()
    first_detection = violation["detections"][0] if violation["detections"] else None

    try:
        ts = datetime.fromisoformat(violation["timestamp"])
    except ValueError:
        ts = datetime.now(timezone.utc)

    incident = Incident(
        id=violation["id"],
        camera_id=camera.id if camera else None,
        location=violation["location"],
        violation_type = first_detection["type"] if first_detection else "unknown",
        status="pending",
        timestamp=ts.astimezone(timezone.utc),
        image_url=first_detection.get("image_url") if first_detection else None
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    # 🔔 Real-time notification to subscribed clients
    await manager.broadcast_all({
        "type": "new_violation",
        "data": violation
    })

    await manager.broadcast_all({
        "type": "stats_update"
    })
    
    await add_audit_log(
        action="NEW VIOLATION DETECTED",
        user="AI System",
        details=f"Violation {violation['id']} detected at {violation['location']}",
        log_type="system",
        db=db
    )
    
    return {"status": "received", "violation": violation}

# ==================== Violation Decisions ====================

class DecisionRequest(BaseModel):
    action: str
    reviewerNote: Optional[str] = None

@app.post("/api/violations/{violation_id}/review")
async def decide_violation(
    violation_id: str,
    decision: DecisionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
   
    incident = db.query(Incident).filter(Incident.id == violation_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Violation not found")

    if decision.action == "approve":
        incident.status = "approved"
    elif decision.action == "reject":
        incident.status = "rejected"
    elif decision.action == "needsInfo":
        incident.status = "needs_info"
    elif decision.action == "reopen":
        incident.status = "pending"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    incident.reviewed_by = int(current_user.id)
    incident.reviewer_note = decision.reviewerNote
    incident.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(incident)

    # IMPORTANT CHANGE HERE
    await manager.broadcast_all(incident.id, {
        "type": "update_violation",
        "data": {
            "id": incident.id,
            "status": incident.status,
            "reviewerNote": incident.reviewer_note
        }
    })

    await manager.broadcast_all({
        "type": "stats_update"
    })

    await add_audit_log(
        action=f"{decision.action.upper()} VIOLATION",
        user=current_user.full_name,
        details=f"Violation {violation_id} marked as {incident.status}",
        log_type="record",
        db=db
    )

    return {
        "status": "success",
        "violation": {
            "id": incident.id,
            "status": incident.status
        }
    }
# ==================== Dashboard ====================

@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()

    helmet = sum(1 for i in incidents if i.violation_type == "no_helmet")
    plate = sum(1 for i in incidents if i.violation_type == "no_plate")
    overload = sum(1 for i in incidents if i.violation_type == "overloading")

    approved = sum(1 for i in incidents if i.status == "approved")
    rejected = sum(1 for i in incidents if i.status == "rejected")
    pending = sum(1 for i in incidents if i.status == "pending")

    today = datetime.now(timezone.utc).date()
    total_today = sum(1 for i in incidents if i.timestamp.date() == today)

    return DashboardStats(
        total_violations_today= total_today,
        helmet_violations=helmet,
        plate_violations=plate,
        overloading_violations=overload,
        pending_review_count=pending,
        approved_count=approved,
        rejected_count=rejected,
        active_cameras=len(RTSP_URLS),
        total_cameras=len(RTSP_URLS),
        average_confidence=0.9
    )

@app.get("/api/dashboard/recent")
async def get_recent_violations(limit: int = 10, db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.timestamp.desc()).limit(limit).all()

    return [
        {
            "id": i.id,
            "timestamp": i.timestamp.isoformat(),
            "location": i.location,
            "camera_id": i.camera_id,
            "detections": [
                {
                    "type": i.violation_type,
                    "confidence": 0.9,
                    "image_url": i.image_url
                }
            ],
            "status": i.status
        }
        for i in incidents
    ]

@app.get("/api/audit/logs")
async def get_audit_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()

    return [
        {
            "id": l.id,
            "action": l.action,
            "user": l.user,
            "details": l.details,
            "type": l.type,
            "timestamp": l.timestamp.isoformat()
        }
        for l in logs
    ]

@app.get("/api/dashboard/trends")
async def get_trends(
    hours: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    trends = []

    incidents = db.query(Incident).all()

    for i in range(hours):
        start_time = now - timedelta(hours=i+1)
        end_time = now - timedelta(hours=i)

        helmet = 0
        plate = 0
        overload = 0

        for v in incidents:
            if start_time <= v.timestamp <= end_time:
                if v.violation_type == "no_helmet":
                    helmet += 1
                elif v.violation_type == "no_plate":
                    plate += 1
                elif v.violation_type == "overloading":
                    overload += 1

        trends.append({
            "timestamp": end_time.isoformat(),
            "helmet_violations": helmet,
            "plate_violations": plate,
            "overloading_violations": overload
        })

    return list(reversed(trends))

@app.delete("/api/violations/{violation_id}")
async def delete_violation(
    violation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == violation_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Violation not found")

    db.delete(incident)
    db.commit()

    await manager.broadcast_all({
        "type": "delete_violation",
        "id": violation_id
    })

    await manager.broadcast_all({"type": "stats_update"})

    await add_audit_log(
        action="DELETE VIOLATION",
        user=current_user.full_name,
        details=f"Violation {violation_id} deleted",
        log_type="delete",
        db=db
    )
    return {"status": "deleted"}

class BulkDeleteRequest(BaseModel):
    ids: List[str]

@app.post("/api/violations/bulk-delete")
async def bulk_delete_violations(
    data: BulkDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    deleted_ids = []

    for vid in data.ids:
        incident = db.query(Incident).filter(Incident.id == vid).first()
        if incident:
            db.delete(incident)
            deleted_ids.append(vid)

    db.commit()

    await manager.broadcast_all({
        "type": "bulk_delete",
        "ids": deleted_ids
    })

    await manager.broadcast_all({
        "type": "stats_update"
    })

    await add_audit_log(
        action="BULK DELETE",
        user=current_user.full_name,
        details=f"Deleted {len(deleted_ids)} violations",
        log_type="record",
        db=db
    )

    return {"status": "deleted", "count": len(deleted_ids)}

class BulkReviewRequest(BaseModel):
    ids: List[str]
    action: str  # approve | reject | needsInfo | reopen

@app.post("/api/violations/bulk-review")
async def bulk_review_violations(
    data: BulkReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_ids = []

    for vid in data.ids:
        incident = db.query(Incident).filter(Incident.id == vid).first()
        
        if incident:
            if data.action == "approve":
                incident.status = "approved"
            elif data.action == "reject":
                incident.status = "rejected"
            elif data.action == "needsInfo":
                incident.status = "needs_info"
            elif data.action == "reopen":
                incident.status = "pending"

            incident.reviewed_by = int(current_user.id)
            incident.reviewed_at = datetime.now(timezone.utc)
            updated_ids.append(incident.id)

            await manager.broadcast_all({
                "type": "update_violation",
                "data": {
                    "id": incident.id,
                    "status": incident.status
                }
            })

    db.commit()

    await manager.broadcast_all({
        "type": "stats_update"
    })

    await add_audit_log(
        action="BULK REVIEW",
        user=current_user.full_name,
        details=f"{data.action} {len(updated_ids)} violations",
        log_type="record",
        db=db
    )

    return {"status": "updated", "count": len(updated_ids)}

@app.get("/api/reports/generate")
async def generate_report(
    start: str,
    end: str,
    format: str = "pdf",
    type: str = "Violation Summary (Daily)",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_date = datetime.fromisoformat(start + "T00:00:00").replace(tzinfo=timezone.utc)
    end_date = datetime.fromisoformat(end + "T23:59:59").replace(tzinfo=timezone.utc)

    # FILTER VIOLATIONS
    incidents = db.query(Incident).all()

    filtered = [
        v for v in incidents
        if start_date <= v.timestamp <= end_date
    ]

    filename = f"Report_{start}_{end}.{format}"

    # SAVE REPORT INFO
    report = {
        "id": f"REP-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "name": filename,
        "user": current_user.full_name,
        "date": datetime.now(timezone.utc).isoformat(),
        "size": f"{len(filtered)} records"
    }

    db_report = Report(
        id=report["id"],
        name=report["name"],
        user=report["user"],
        date=datetime.now(timezone.utc),
        size=report["size"]
    )

    db.add(db_report)
    db.commit()

    await manager.broadcast_all({
        "type": "new_report",
        "data": report
    })

    await add_audit_log(
        action="GENERATE REPORT",
        user=current_user.full_name,
        details=f"Generated report {filename}",
        log_type="report",
        db=db
    )

    # ================= CSV =================
    if format == "csv":
        output = StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "Violation ID",
            "Timestamp",
            "Location",
            "Camera",
            "Violation Type",
            "Confidence",
            "Status"
        ])

        for v in filtered:
            writer.writerow([
                v.id,
                v.timestamp.isoformat(),
                v.location,
                v.camera_id,
                v.violation_type,
                0.9,
                v.status
            ])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    # ================= XLSX =================
    if format == "xlsx":
        wb = Workbook()
        ws = wb.active
        ws.title = "Violations"

        ws.append([
            "Violation ID",
            "Timestamp",
            "Location",
            "Camera",
            "Violation Type",
            "Confidence",
            "Status"
        ])

        for v in filtered:
            ws.append([
                v.id,
                v.timestamp.isoformat(),
                v.location,
                v.camera_id,
                v.violation_type,
                0.9,
                v.status
            ])

        stream = BytesIO()
        wb.save(stream)
        stream.seek(0)

        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    # ================= PDF =================
    if format == "pdf":
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        y = 750

        p.drawString(50, y, "Violation Report")
        y -= 20
        p.drawString(50, y, f"Date Range: {start} to {end}")
        y -= 30

        for v in filtered:
            text = f"{v.timestamp.isoformat()} | {v.location} | {v.violation_type} | {v.status}"
            p.drawString(50, y, text)
            y -= 15

            if y < 50:
                p.showPage()
                y = 750

        p.save()
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    raise HTTPException(status_code=400, detail="Invalid format")

@app.get("/api/reports/recent")
async def get_recent_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = db.query(Report)\
        .order_by(Report.date.desc())\
        .limit(10)\
        .all()

    return {
        "reports": [
            {
                "id": r.id,
                "name": r.name,
                "user": r.user,
                "date": r.date.isoformat(),
                "size": r.size
            }
            for r in reports
        ]
    }

@app.delete("/api/reports/{report_id}")
async def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    

    await add_audit_log(
        action="DELETE REPORT",
        user=current_user.full_name,
        details=f"Report {report_id} deleted",
        log_type="report",
        db=db
    )

    db.delete(report)
    db.commit()

    return {"status": "deleted"}

@app.get("/api/reports/download/{report_id}")
async def download_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    content = f"Report File: {report.name}\nGenerated by {report.user}"
    file_bytes = content.encode("utf-8")
    file_stream = BytesIO(file_bytes)

    return StreamingResponse(
        file_stream,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={report.name}"}
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
                print(f"[WARN] Camera {self.url} disconnected. Reconnecting...")
                self.cap.release()
                time.sleep(1)
                self.cap = cv2.VideoCapture(self.url)
                continue
            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                if self.frame_queue.full():
                    self.frame_queue.get()
                self.frame_queue.put(buffer.tobytes())
            
            time.sleep(0.03)

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

def generate_offline_frame():
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(img, "CAMERA OFFLINE", (150, 240),
                cv2.FONT_HERSHEY_SIMPLEX, 1,
                (0, 0, 255), 2, cv2.LINE_AA)
    ret, buffer = cv2.imencode('.jpg', img)
    return buffer.tobytes()

OFFLINE_FRAME = generate_offline_frame()

def gen_frames(stream: FFMpegCameraStream):
    while True:
        frame = stream.get_frame()
        if frame:
            output = frame
        else:
            output = OFFLINE_FRAME  # show offline image instead

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + output + b'\r\n')

@app.get("/camera-feed/{camera_id}")
def camera_feed(camera_id: str):
    stream = get_camera_stream(camera_id)
    return StreamingResponse(
        gen_frames(stream),
        media_type='multipart/x-mixed-replace; boundary=frame'
    )

@app.get("/api/cameras", response_model=List[CameraResponse])
async def get_cameras(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Camera).all()

@app.get("/api/cameras/status")
async def camera_status():
    status = []
    for cam_id in RTSP_URLS.keys():
        try:
            stream = get_camera_stream(cam_id)
            frame = stream.get_frame()
            if frame:
                status.append({"camera_id": cam_id, "status": "online"})
            else:
                status.append({"camera_id": cam_id, "status": "offline"})
        except:
            status.append({"camera_id": cam_id, "status": "offline"})
    return status

# ==================== Health ====================

@app.get("/")
async def root():
    return {"message": "SafeRide API running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}