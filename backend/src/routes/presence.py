"""WebSocket endpoint for user presence tracking."""
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..queue import presence_manager

router = APIRouter()


@router.websocket("/ws/presence")
async def presence_ws(ws: WebSocket):
    await ws.accept()
    client_id = str(uuid.uuid4())
    await presence_manager.connect(client_id, ws)
    try:
        while True:
            await ws.receive_text()  # keep-alive
    except WebSocketDisconnect:
        await presence_manager.disconnect(client_id)
