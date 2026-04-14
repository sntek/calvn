"""Oracle ADB connection registration with the local MCP server."""
from __future__ import annotations

import asyncio
import json
import re
import sys
from dataclasses import dataclass
from typing import Any

from pydantic_ai.mcp import MCPServerStreamableHTTP

from ..config import (
    ORACLE_DISPLAY_NAME,
    ORACLE_MCP_URL,
    ORACLE_PASSWORD,
    ORACLE_TNS_ALIAS,
    ORACLE_USER,
    ORACLE_WALLET_DIR,
)


@dataclass
class RegistrationResult:
    ok: bool
    display_name: str | None
    connection_id: str | None
    alias_used: str | None
    message: str


def _extract_text(result: Any) -> str:
    parts = []
    for block in getattr(result, "content", []) or []:
        text = getattr(block, "text", None)
        if text:
            parts.append(text)
    return "\n".join(parts) or repr(result)


def _try_parse_json(text: str) -> dict | None:
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return None


def _pick_alias(preferred: str, available: list[str]) -> str | None:
    if preferred in available:
        return preferred
    pref_lower = preferred.lower()
    for length in range(len(pref_lower), 2, -1):
        for start in range(len(pref_lower) - length + 1):
            chunk = pref_lower[start : start + length]
            for cand in available:
                if chunk in cand.lower():
                    return cand
    for cand in available:
        if cand.lower().endswith("_low"):
            return cand
    return available[0] if available else None


async def _register_via_mcp(
    server: MCPServerStreamableHTTP,
    *,
    wallet_directory: str,
    alias: str,
    username: str,
    password: str,
    display_name: str,
) -> RegistrationResult:
    async def _import(a: str) -> dict:
        res = await server.direct_call_tool(
            "db_import_wallet",
            {
                "walletDirectory": wallet_directory,
                "alias": a,
                "username": username,
                "password": password,
                "displayName": display_name,
                "safetyMode": "readonly",
            },
        )
        return _try_parse_json(_extract_text(res)) or {"raw": _extract_text(res)}

    first = await _import(alias)
    if first.get("connectionId"):
        return RegistrationResult(
            ok=True,
            display_name=first.get("displayName"),
            connection_id=first.get("connectionId"),
            alias_used=alias,
            message=f"Registered '{first.get('displayName')}' via alias '{alias}'.",
        )

    err = first.get("error", "") or first.get("raw", "")
    match = re.search(r"Available:\s*(.+)$", err)
    if not match:
        return RegistrationResult(
            ok=False,
            display_name=None,
            connection_id=None,
            alias_used=None,
            message=f"Wallet import failed: {err or first}",
        )
    available = [a.strip() for a in match.group(1).split(",") if a.strip()]
    chosen = _pick_alias(alias, available)
    if not chosen:
        return RegistrationResult(
            ok=False,
            display_name=None,
            connection_id=None,
            alias_used=None,
            message=f"No matching alias found. Wallet has: {available}",
        )
    retry = await _import(chosen)
    if retry.get("connectionId"):
        return RegistrationResult(
            ok=True,
            display_name=retry.get("displayName"),
            connection_id=retry.get("connectionId"),
            alias_used=chosen,
            message=(
                f"Alias '{alias}' not found in wallet. Fell back to '{chosen}' "
                f"(available: {available}). Registered '{retry.get('displayName')}'."
            ),
        )
    return RegistrationResult(
        ok=False,
        display_name=None,
        connection_id=None,
        alias_used=None,
        message=f"Retry with '{chosen}' also failed: {retry}",
    )


async def register_connection(
    *,
    wallet_directory: str,
    alias: str,
    username: str,
    password: str,
    display_name: str,
    skip_if_exists: bool = True,
) -> RegistrationResult:
    server = MCPServerStreamableHTTP(ORACLE_MCP_URL)
    async with server:
        if skip_if_exists:
            listing = _extract_text(await server.direct_call_tool("db_list_connections", {}))
            if display_name in listing:
                return RegistrationResult(
                    ok=True,
                    display_name=display_name,
                    connection_id=None,
                    alias_used=None,
                    message=f"Connection '{display_name}' already registered.",
                )
        return await _register_via_mcp(
            server,
            wallet_directory=wallet_directory,
            alias=alias,
            username=username,
            password=password,
            display_name=display_name,
        )


async def ensure_oracle_connection() -> None:
    missing = [
        n
        for n, v in {
            "ORACLE_USER": ORACLE_USER,
            "ORACLE_PASSWORD": ORACLE_PASSWORD,
            "ORACLE_WALLET_DIR": ORACLE_WALLET_DIR,
            "ORACLE_TNS_ALIAS": ORACLE_TNS_ALIAS,
        }.items()
        if not v
    ]
    if missing:
        print(f"[oracle_setup] Skipping — missing env vars: {', '.join(missing)}")
        return

    result = await register_connection(
        wallet_directory=ORACLE_WALLET_DIR,
        alias=ORACLE_TNS_ALIAS,
        username=ORACLE_USER,
        password=ORACLE_PASSWORD,
        display_name=ORACLE_DISPLAY_NAME,
    )
    print(f"[oracle_setup] {result.message}")
    if not result.ok:
        print(f"[oracle_setup] WARNING: Oracle registration failed, continuing anyway")


if __name__ == "__main__":
    try:
        asyncio.run(ensure_oracle_connection())
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
