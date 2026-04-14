"""WebSocket endpoint for user presence tracking."""
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..queue.presence import presence_manager

router = APIRouter()


@router.websocket("/ws/presence")
async def presence_ws(ws: WebSocket, clientId: str | None = None):
    await ws.accept()

    # Use the stable per-tab ID from the client if provided.
    # Fall back to a server-generated one for clients that don't send it.
    effective_id = clientId if clientId else str(uuid.uuid4())

    await presence_manager.connect(effective_id, ws)
    try:
        while True:
            # Keep the connection alive; ignore incoming messages (client pings).
            await ws.receive_text()
    except WebSocketDisconnect:
        await presence_manager.disconnect(effective_id)
    except Exception:
        await presence_manager.disconnect(effective_id)
