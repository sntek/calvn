"""Track connected users via WebSocket."""
from __future__ import annotations

import asyncio
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
            self._connections[client_id] = ws
        await self._broadcast()

    async def disconnect(self, client_id: str) -> None:
        async with self._lock:
            self._connections.pop(client_id, None)
        await self._broadcast()

    async def _broadcast(self) -> None:
        count = self.count
        dead = []
        for cid, ws in list(self._connections.items()):
            try:
                await ws.send_json({"type": "presence", "count": count})
            except Exception:
                dead.append(cid)
        for cid in dead:
            async with self._lock:
                self._connections.pop(cid, None)


presence_manager = PresenceManager()
