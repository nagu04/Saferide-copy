from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# LOCAL DATABASE (MySQL)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE URL not set")

# Create the engine
engine = create_engine(
    DATABASE_URL,
    echo=True,             # Optional: shows SQL queries in console for debugging
    pool_pre_ping=True     # Keeps the connection alive
)

# Create session class
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for models
Base = declarative_base()


# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()