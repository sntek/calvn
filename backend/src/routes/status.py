"""Health check endpoint for MCP and AI connections."""
from __future__ import annotations

import asyncio
import json
import re
import time
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import APIRouter
from pydantic_ai.mcp import MCPServerStreamableHTTP

from ..config import (
    BIFROST_BASE_URL,
    JIRA_MCP_URL,
    ORACLE_DISPLAY_NAME,
    ORACLE_MCP_URL,
    QWEN_BASE_URL,
)

router = APIRouter()


@dataclass
class Check:
    name: str
    ok: bool
    detail: str
    elapsed_ms: int
    type: str  # "mcp" | "ai"


def _extract_text(result: Any) -> str:
    parts = []
    for block in getattr(result, "content", []) or []:
        text = getattr(block, "text", None)
        if text:
            parts.append(text)
    return "\n".join(parts) or repr(result)


_ID_TOKEN = re.compile(r"\b[a-z]+_[a-z0-9_]+_adb_[a-f0-9]+\b", re.IGNORECASE)


def _find_connection_id(listing_text: str, display_name: str) -> str | None:
    try:
        data = json.loads(listing_text)
        entries = data if isinstance(data, list) else data.get("connections", [])
        for entry in entries:
            if display_name in json.dumps(entry):
                cid = entry.get("connectionId") or entry.get("id")
                if cid:
                    return cid
    except (json.JSONDecodeError, TypeError, AttributeError):
        pass
    ids = re.findall(r'"connectionId"\s*:\s*"([^"]+)"', listing_text)
    names = re.findall(r'"displayName"\s*:\s*"([^"]+)"', listing_text)
    for cid, name in zip(ids, names):
        if display_name in name:
            return cid
    candidates = list(dict.fromkeys(_ID_TOKEN.findall(listing_text)))
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]
    idx = listing_text.find(display_name)
    if idx == -1:
        return candidates[0]
    return min(candidates, key=lambda c: abs(listing_text.find(c) - idx))


async def check_oracle() -> Check:
    start = time.monotonic()
    try:
        server = MCPServerStreamableHTTP(ORACLE_MCP_URL)
        async with server:
            listing = _extract_text(await server.direct_call_tool("db_list_connections", {}))
            if ORACLE_DISPLAY_NAME not in listing:
                return Check(
                    "Oracle DB", False,
                    f"Connection '{ORACLE_DISPLAY_NAME}' not registered.",
                    int((time.monotonic() - start) * 1000), "mcp",
                )
            conn_id = _find_connection_id(listing, ORACLE_DISPLAY_NAME)
            if not conn_id:
                return Check(
                    "Oracle DB", False,
                    f"Found '{ORACLE_DISPLAY_NAME}' but could not extract connection ID.",
                    int((time.monotonic() - start) * 1000), "mcp",
                )
            ping = _extract_text(
                await server.direct_call_tool(
                    "db_query",
                    {"connection": conn_id, "query": "SELECT 1 AS ping FROM dual"},
                )
            )
            if '"PING"' in ping or "Returned 1 row" in ping or '"ping"' in ping.lower():
                return Check(
                    "Oracle DB", True,
                    f"Connected. connectionId={conn_id}",
                    int((time.monotonic() - start) * 1000), "mcp",
                )
            return Check(
                "Oracle DB", False,
                f"Registered but probe query failed.",
                int((time.monotonic() - start) * 1000), "mcp",
            )
    except Exception as e:
        return Check(
            "Oracle DB", False,
            f"{type(e).__name__}: {e}",
            int((time.monotonic() - start) * 1000), "mcp",
        )


async def check_jira() -> Check:
    start = time.monotonic()
    try:
        server = MCPServerStreamableHTTP(JIRA_MCP_URL)
        async with server:
            tools = await server.list_tools()
            n = len(tools)
            if n == 0:
                return Check(
                    "Jira MCP", False,
                    "Reachable but 0 tools.", int((time.monotonic() - start) * 1000), "mcp",
                )
            return Check(
                "Jira MCP", True,
                f"Reachable. {n} tools available. Scoped to NOVAs.",
                int((time.monotonic() - start) * 1000), "mcp",
            )
    except Exception as e:
        return Check(
            "Jira MCP", False,
            f"{type(e).__name__}: {e}",
            int((time.monotonic() - start) * 1000), "mcp",
        )


async def check_bifrost() -> Check:
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{BIFROST_BASE_URL}/models")
            if resp.status_code == 200:
                return Check(
                    "Bifrost (Cloud AI)", True,
                    "Reachable. Model endpoint responsive.",
                    int((time.monotonic() - start) * 1000), "ai",
                )
            return Check(
                "Bifrost (Cloud AI)", False,
                f"HTTP {resp.status_code}",
                int((time.monotonic() - start) * 1000), "ai",
            )
    except Exception as e:
        return Check(
            "Bifrost (Cloud AI)", False,
            f"{type(e).__name__}: {e}",
            int((time.monotonic() - start) * 1000), "ai",
        )


async def check_qwen() -> Check:
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{QWEN_BASE_URL}/models")
            if resp.status_code == 200:
                return Check(
                    "Qwen (Local AI)", True,
                    "LM Studio reachable.",
                    int((time.monotonic() - start) * 1000), "ai",
                )
            return Check(
                "Qwen (Local AI)", False,
                f"HTTP {resp.status_code}",
                int((time.monotonic() - start) * 1000), "ai",
            )
    except Exception as e:
        return Check(
            "Qwen (Local AI)", False,
            f"{type(e).__name__}: {e}",
            int((time.monotonic() - start) * 1000), "ai",
        )


@router.get("/api/status")
async def status():
    checks = await asyncio.gather(
        check_oracle(), check_jira(), check_bifrost(), check_qwen()
    )
    return {
        "checks": [
            {
                "name": c.name,
                "ok": c.ok,
                "detail": c.detail,
                "elapsed_ms": c.elapsed_ms,
                "type": c.type,
            }
            for c in checks
        ],
        "all_ok": all(c.ok for c in checks),
    }
