from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse, PlainTextResponse, FileResponse
from io import BytesIO, StringIO
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
from random import randint, uniform
from passlib.context import CryptContext
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from openpyxl import Workbook
import cv2, csv, threading, queue, jwt, secrets
import numpy as np

print(secrets.token_hex(32))

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
    "created_at": datetime.now(timezone.utc).isoformat(),
    "is_active": True
}

MOCK_VIOLATIONS = []

MOCK_AUDIT_LOGS = []

MOCK_REPORTS = []

MOCK_CAMERAS = [
    {"id": "CAM-001", "name": "Main Gate", "location": "Sucat Main Gate"},
]

# ==================== Helper Functions ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
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
        "id": f"LOG-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}",
        "action": action,
        "user": user,
        "details": details,
        "type": log_type,
        "ip": ip,
        "timestamp": datetime.now(timezone.utc).isoformat()
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
                except:
                    await websocket.close(code=1008)

            elif data.get("type") == "subscribe":
                if not authenticated:
                    await websocket.close(code=1008)
                    return

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
    return {
        "violations": MOCK_VIOLATIONS,
        "total": len(MOCK_VIOLATIONS),
        "page": 1,
        "page_size": len(MOCK_VIOLATIONS)
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
    
    global MOCK_VIOLATIONS
    MOCK_VIOLATIONS.insert(0, violation)
    MOCK_VIOLATIONS = MOCK_VIOLATIONS[:5000]
    
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
        log_type="system"
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
    current_user: User = Depends(get_current_user)
):
    violation = None
    for v in MOCK_VIOLATIONS:
        if v["id"] == violation_id:
            violation = v
            break

    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

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
    violation["reviewed_at"] = datetime.now(timezone.utc).isoformat()

    # IMPORTANT CHANGE HERE
    await manager.broadcast_all({
        "type": "update_violation",
        "data": violation
    })

    await manager.broadcast_all({
        "type": "stats_update"
    })

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
        1 for v in MOCK_VIOLATIONS for d in v["detections"] if d["type"] == "no_plate"
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
    now = datetime.now(timezone.utc)
    trends = []

    for i in range(hours):
        start_time = now - timedelta(hours=i+1)
        end_time = now - timedelta(hours=i)

        helmet = 0
        plate = 0
        overload = 0

        for v in MOCK_VIOLATIONS:
            v_time = datetime.fromisoformat(v["timestamp"])
            if start_time <= v_time <= end_time:
                for d in v["detections"]:
                    if d["type"] == "no_helmet":
                        helmet += 1
                    elif d["type"] == "no_plate":
                        plate += 1
                    elif d["type"] == "overloading":
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
    current_user: User = Depends(get_current_user)
):
    global MOCK_VIOLATIONS

    before_count = len(MOCK_VIOLATIONS)
    MOCK_VIOLATIONS = [v for v in MOCK_VIOLATIONS if v["id"] != violation_id]

    if len(MOCK_VIOLATIONS) == before_count:
        raise HTTPException(status_code=404, detail="Violation not found")

    await manager.broadcast_all({
        "type": "delete_violation",
        "id": violation_id
    })

    await manager.broadcast_all({
        "type": "stats_update"
    })
    

    await add_audit_log(
        action="DELETE VIOLATION",
        user=current_user.full_name,
        details=f"Violation {violation_id} deleted",
        log_type="delete"
    )

    return {"status": "deleted"}

class BulkDeleteRequest(BaseModel):
    ids: List[str]

@app.post("/api/violations/bulk-delete")
async def bulk_delete_violations(
    data: BulkDeleteRequest,
    current_user: User = Depends(get_current_user)
):
    global MOCK_VIOLATIONS

    deleted_ids = data.ids
    MOCK_VIOLATIONS = [v for v in MOCK_VIOLATIONS if v["id"] not in deleted_ids]

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
        log_type="record"
    )

    return {"status": "deleted", "count": len(deleted_ids)}

class BulkReviewRequest(BaseModel):
    ids: List[str]
    action: str  # approve | reject | needsInfo | reopen

@app.post("/api/violations/bulk-review")
async def bulk_review_violations(
    data: BulkReviewRequest,
    current_user: User = Depends(get_current_user)
):
    updated_ids = []

    for v in MOCK_VIOLATIONS:
        if v["id"] in data.ids:
            if data.action == "approve":
                v["status"] = "approved"
            elif data.action == "reject":
                v["status"] = "rejected"
            elif data.action == "needsInfo":
                v["status"] = "needs_info"
            elif data.action == "reopen":
                v["status"] = "pending"

            v["reviewed_by"] = current_user.full_name
            v["reviewed_at"] = datetime.now(timezone.utc).isoformat()
            updated_ids.append(v["id"])

            # broadcast each update
            await manager.broadcast_all({
                "type": "update_violation",
                "data": v
            })

    await manager.broadcast_all({
        "type": "stats_update"
    })

    await add_audit_log(
        action="BULK REVIEW",
        user=current_user.full_name,
        details=f"{data.action} {len(updated_ids)} violations",
        log_type="record"
    )

    return {"status": "updated", "count": len(updated_ids)}


@app.get("/api/reports/generate")
async def generate_report(
    start: str,
    end: str,
    format: str = "pdf",
    type: str = "Violation Summary (Daily)",
    current_user: User = Depends(get_current_user)
):
    start_date = datetime.fromisoformat(start + "T00:00:00").replace(tzinfo=timezone.utc)
    end_date = datetime.fromisoformat(end + "T23:59:59").replace(tzinfo=timezone.utc)

    # FILTER VIOLATIONS
    filtered = MOCK_VIOLATIONS
    for v in MOCK_VIOLATIONS:
        v_time = datetime.fromisoformat(v["timestamp"])
        if start_date <= v_time <= end_date:
            filtered.append(v)

    filename = f"Report_{start}_{end}.{format}"

    # SAVE REPORT INFO
    report = {
        "id": f"REP-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "name": filename,
        "user": current_user.full_name,
        "date": datetime.now(timezone.utc).isoformat(),
        "size": f"{len(filtered)} records"
    }

    MOCK_REPORTS.insert(0, report)

    await manager.broadcast_all({
        "type": "new_report",
        "data": report
    })

    await add_audit_log(
        action="GENERATE REPORT",
        user=current_user.full_name,
        details=f"Generated report {filename}",
        log_type="report"
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
            for d in v["detections"]:
                if not v["detections"]:
                    writer.writerow([
                        v["id"],
                        v["timestamp"],
                        v["location"],
                        v["camera_id"],
                        "N/A",
                        "N/A",
                        v["status"]
                    ])
        print("TOTAL VIOLATIONS:", len(MOCK_VIOLATIONS))
        print("FILTERED:", len(filtered))
        print("START:", start_date, "END:", end_date)

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
            for d in v["detections"]:
                if not v["detections"]:
                    writer.writerow([
                        v["id"],
                        v["timestamp"],
                        v["location"],
                        v["camera_id"],
                        "N/A",
                        "N/A",
                        v["status"]
                    ])
        print("TOTAL VIOLATIONS:", len(MOCK_VIOLATIONS))
        print("FILTERED:", len(filtered))
        print("START:", start_date, "END:", end_date)
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
            for d in v["detections"]:
                text = f"{v['timestamp']} | {v['location']} | {d['type']} | {v['status']}"
                p.drawString(50, y, text)
                y -= 15
                if y < 50:
                    p.showPage()
                    y = 750

        p.save()
        buffer.seek(0)
        print("TOTAL VIOLATIONS:", len(MOCK_VIOLATIONS))
        print("FILTERED:", len(filtered))
        print("START:", start_date, "END:", end_date)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    raise HTTPException(status_code=400, detail="Invalid format")


@app.get("/api/reports/recent")
async def get_recent_reports(current_user: User = Depends(get_current_user)):
    return {"reports": MOCK_REPORTS[:10]}


@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str, current_user: User = Depends(get_current_user)):
    global MOCK_REPORTS
    MOCK_REPORTS = [r for r in MOCK_REPORTS if r["id"] != report_id]

    await add_audit_log(
        action="DELETE REPORT",
        user=current_user.full_name,
        details=f"Report {report_id} deleted"
    )

    return {"status": "success"}

@app.get("/api/reports/download/{report_id}")
async def download_report(report_id: str, current_user: User = Depends(get_current_user)):
    report = next((r for r in MOCK_REPORTS if r["id"] == report_id), None)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    content = f"Report File: {report['name']}\nGenerated by {report['user']}"
    file_bytes = content.encode("utf-8")
    file_stream = BytesIO(file_bytes)

    return StreamingResponse(
        file_stream,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={report['name']}"}
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

@app.get("/api/cameras", response_model=List[Camera])
async def get_cameras(current_user: User = Depends(get_current_user)):
    return MOCK_CAMERAS

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