# SafeRide Python Backend - Quick Start

This is a minimal FastAPI backend starter template for the SafeRide motorcycle violation detection system.

## Features

✅ JWT Authentication
✅ CORS configured for React frontend
✅ Mock data for immediate testing
✅ WebSocket support for real-time updates
✅ Basic violation endpoints
✅ Ready for YOLOv11 integration

## Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Running

```bash
# Start the server
uvicorn main:app --reload --port 8000

# Server will run on http://localhost:8000
```

## Testing

### 1. Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Login (get JWT token)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'

# Get violations (requires auth token)
curl http://localhost:8000/api/violations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Test with React Frontend

Make sure the React frontend is configured:

```bash
# In the React project root
echo "VITE_USE_MOCK_DATA=false" > .env.local
echo "VITE_API_BASE_URL=http://localhost:8000" >> .env.local
echo "VITE_WS_BASE_URL=ws://localhost:8000" >> .env.local

npm run dev
```

Login with:
- Username: `admin`
- Password: `admin`

## Default Credentials

```
Username: admin
Password: admin
```

⚠️ **Change these in production!**

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Next Steps

### 1. Add Database

Replace mock data with real database:

**PostgreSQL:**
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:password@localhost/saferide"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
```

**MongoDB:**
```python
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client.saferide
```

### 2. Integrate YOLOv11

```python
from ultralytics import YOLO
import cv2

# Load YOLOv11 model
model = YOLO('yolov11n.pt')

async def process_camera_feed(camera_id: str, stream_url: str):
    cap = cv2.VideoCapture(stream_url)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Run detection
        results = model(frame)
        
        # Process results
        for r in results:
            boxes = r.boxes
            for box in boxes:
                # Check if it's a violation
                if is_violation(box):
                    await on_yolo_detection(camera_id, frame, detections)
```

### 3. Add Database Models

Create `models.py`:

```python
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Violation(Base):
    __tablename__ = "violations"
    
    id = Column(String, primary_key=True)
    timestamp = Column(DateTime, nullable=False)
    location = Column(String, nullable=False)
    camera_id = Column(String, nullable=False)
    detections = Column(JSON, nullable=False)
    plate_data = Column(JSON)
    status = Column(String, default="pending")
    # ... add other fields
```

### 4. Add Environment Variables

Create `.env`:

```
DATABASE_URL=postgresql://user:password@localhost/saferide
JWT_SECRET_KEY=your-super-secret-key-change-this
ALLOWED_ORIGINS=http://localhost:5173,https://dashboard.saferide.gov.ph
```

Load in `main.py`:

```python
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
```

## Deployment

### Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t saferide-backend .
docker run -p 8000:8000 saferide-backend
```

### Production Server

```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Directory Structure

```
saferide-backend/
├── main.py              # Main FastAPI application
├── requirements.txt     # Python dependencies
├── models.py           # Database models (create this)
├── database.py         # Database connection (create this)
├── yolo_detector.py    # YOLOv11 integration (create this)
├── .env                # Environment variables (create this)
└── README.md           # This file
```

## Resources

- FastAPI Documentation: https://fastapi.tiangolo.com/
- YOLOv11 Documentation: https://docs.ultralytics.com/
- React Frontend Integration Guide: See `/INTEGRATION_GUIDE.md` in React project
- Complete API Spec: See `/PYTHON_BACKEND_API.md` in React project
