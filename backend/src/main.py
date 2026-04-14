"""CALVN AI Backend — FastAPI application."""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging so chat route messages are visible
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logging.getLogger("calvn").setLevel(logging.DEBUG)

import httpx

from .config import (
    BIFROST_BASE_URL,
    FRONTEND_URL,
    JIRA_MCP_URL,
    ORACLE_MCP_URL,
    QWEN_BASE_URL,
)
from .db.engine import init_db
from .oracle.setup import ensure_oracle_connection
from .queue.presence import presence_ping_loop
from .routes import (
    analytics_router,
    chat_router,
    presence_router,
    settings_router,
    skills_router,
    status_router,
)
from .skills import skill_registry

# Startup warnings surfaced to the frontend via /api/health
_startup_warnings: list[dict] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    _startup_warnings.clear()

    print("[calvn] Initializing database...")
    await init_db()
    print("[calvn] Loading skills...")
    skill_registry.load_all()
    # --- Startup health checks for all critical services ---
    async with httpx.AsyncClient(timeout=5) as client:
        # Check Bifrost (cloud AI for orchestrator + oracle agent)
        print("[calvn] Checking Bifrost AI endpoint...")
        try:
            resp = await client.get(f"{BIFROST_BASE_URL}/models")
            if resp.status_code == 200:
                print(f"[calvn] Bifrost AI: OK")
            else:
                msg = f"Bifrost AI endpoint returned HTTP {resp.status_code}."
                _startup_warnings.append({
                    "level": "warning",
                    "source": "Bifrost AI",
                    "message": msg,
                    "action": f"Check that the Bifrost gateway is running at {BIFROST_BASE_URL}",
                })
                print(f"[calvn] WARNING: {msg}")
        except Exception as e:
            msg = f"Cannot reach Bifrost AI at {BIFROST_BASE_URL}. The orchestrator and Oracle agent will not work."
            _startup_warnings.append({
                "level": "error",
                "source": "Bifrost AI",
                "message": msg,
                "action": f"Ensure the Bifrost gateway is running and accessible at {BIFROST_BASE_URL}",
            })
            print(f"[calvn] WARNING: {msg} ({e})")

        # Check Qwen / LM Studio (local AI for Jira agent — security boundary)
        print("[calvn] Checking Qwen (LM Studio) endpoint...")
        try:
            resp = await client.get(f"{QWEN_BASE_URL}/models")
            if resp.status_code == 200:
                print(f"[calvn] Qwen (LM Studio): OK")
            else:
                msg = f"Qwen endpoint returned HTTP {resp.status_code}."
                _startup_warnings.append({
                    "level": "warning",
                    "source": "Qwen (LM Studio)",
                    "message": msg,
                    "action": f"Check that LM Studio is running at {QWEN_BASE_URL}",
                })
                print(f"[calvn] WARNING: {msg}")
        except Exception as e:
            msg = (
                f"Cannot reach Qwen (LM Studio) at {QWEN_BASE_URL}. "
                "Jira queries will fail — the Jira agent requires a local model for data security."
            )
            _startup_warnings.append({
                "level": "error",
                "source": "Qwen (LM Studio)",
                "message": msg,
                "action": f"Start LM Studio and load a Qwen model, then ensure it's serving at {QWEN_BASE_URL}",
            })
            print(f"[calvn] WARNING: {msg} ({e})")

        # Check Jira MCP
        print("[calvn] Checking Jira MCP server...")
        try:
            resp = await client.post(JIRA_MCP_URL, json={"jsonrpc": "2.0", "method": "initialize", "id": 1, "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "calvn-healthcheck", "version": "0.1.0"}}})
            if resp.status_code in (200, 202):
                print(f"[calvn] Jira MCP: OK")
            else:
                msg = f"Jira MCP server returned HTTP {resp.status_code}."
                _startup_warnings.append({
                    "level": "warning",
                    "source": "Jira MCP",
                    "message": msg,
                    "action": f"Check that the Jira MCP server is running at {JIRA_MCP_URL}",
                })
                print(f"[calvn] WARNING: {msg}")
        except Exception as e:
            msg = f"Cannot reach Jira MCP server at {JIRA_MCP_URL}. Jira queries will not work."
            _startup_warnings.append({
                "level": "error",
                "source": "Jira MCP",
                "message": msg,
                "action": f"Ensure the Jira MCP server is accessible at {JIRA_MCP_URL}",
            })
            print(f"[calvn] WARNING: {msg} ({e})")

    # Register Oracle DB connection via MCP
    print("[calvn] Registering Oracle connection...")
    try:
        await ensure_oracle_connection()
    except Exception as e:
        msg = (
            f"Could not reach Oracle MCP server at {ORACLE_MCP_URL}. "
            "Make sure the database MCP server is running before querying Oracle data."
        )
        _startup_warnings.append({
            "level": "error",
            "source": "Oracle MCP",
            "message": msg,
            "action": "Start the Oracle MCP server (e.g. npx @anthropic/database-mcp --port 8081) then refresh.",
        })
        print(f"[calvn] WARNING: {msg} ({e})")

    # Background task: evict dead WebSocket connections every 30 s
    ping_task = asyncio.create_task(presence_ping_loop())

    print("[calvn] Ready.")
    yield
    # Shutdown
    ping_task.cancel()
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
    return {
        "status": "ok" if not _startup_warnings else "degraded",
        "service": "calvn-ai",
        "warnings": _startup_warnings,
    }
