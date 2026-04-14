"""Track connected users via WebSocket.

Design decisions:
- Client supplies a stable clientId (per browser tab) in the query string.
  This means a reconnect from the same tab replaces the old socket instead
  of adding a new entry — no phantom duplicates on HMR / Strict Mode.
- Server sends a periodic ping every 30 s; dead sockets are evicted on
  the first failed send rather than waiting for the next broadcast.
"""
from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field

from fastapi import WebSocket


@dataclass
class PresenceManager:
    _connections: dict[str, WebSocket] = field(default_factory=dict)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    @property
    def count(self) -> int:
        return len(self._connections)

    async def connect(self, client_id: str, ws: WebSocket) -> None:
        async with self._lock:
            # If same client reconnects (e.g. HMR), replace the old socket.
            # The old socket is already closed on the client side; closing it
            # here is a no-op but harmless.
            old = self._connections.get(client_id)
            if old is not None:
                try:
                    await old.close()
                except Exception:
                    pass
            self._connections[client_id] = ws
        await self._broadcast()

    async def disconnect(self, client_id: str) -> None:
        async with self._lock:
            self._connections.pop(client_id, None)
        await self._broadcast()

    async def _broadcast(self) -> None:
        """Send current count to all connections; evict dead ones."""
        count = self.count
        dead: list[str] = []
        for cid, ws in list(self._connections.items()):
            try:
                await ws.send_json({"type": "presence", "count": count})
            except Exception:
                dead.append(cid)
        if dead:
            async with self._lock:
                for cid in dead:
                    self._connections.pop(cid, None)
            # Re-broadcast with the corrected count after evictions.
            corrected = self.count
            for ws in list(self._connections.values()):
                try:
                    await ws.send_json({"type": "presence", "count": corrected})
                except Exception:
                    pass

    async def ping_all(self) -> None:
        """Ping every socket; evict those that don't respond.
        Called periodically to clean up dead connections."""
        dead: list[str] = []
        for cid, ws in list(self._connections.items()):
            try:
                await ws.send_json({"type": "ping"})
            except Exception:
                dead.append(cid)
        if dead:
            async with self._lock:
                for cid in dead:
                    self._connections.pop(cid, None)
            await self._broadcast()


presence_manager = PresenceManager()


async def presence_ping_loop() -> None:
    """Background task: ping all connections every 30 s to evict dead sockets."""
    while True:
        await asyncio.sleep(30)
        await presence_manager.ping_all()
