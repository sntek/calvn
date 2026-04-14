"""CALVN AI Backend — FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import FRONTEND_URL
from .db.engine import init_db
from .oracle.setup import ensure_oracle_connection
from .routes import (
    analytics_router,
    chat_router,
    presence_router,
    settings_router,
    skills_router,
    status_router,
)
from .skills import skill_registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[calvn] Initializing database...")
    await init_db()
    print("[calvn] Loading skills...")
    skill_registry.load_all()
    print("[calvn] Registering Oracle connection...")
    await ensure_oracle_connection()
    print("[calvn] Ready.")
    yield
    # Shutdown
    print("[calvn] Shutting down.")


app = FastAPI(
    title="CALVN AI",
    description="Multi-agent orchestrator for manufacturing defect root cause analysis",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(status_router)
app.include_router(settings_router)
app.include_router(analytics_router)
app.include_router(presence_router)
app.include_router(skills_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "calvn-ai"}
