"""Analytics endpoints for session and message metrics."""
from fastapi import APIRouter

from ..queue import queue_limiter, presence_manager

router = APIRouter()


@router.get("/api/analytics/queue")
async def queue_status():
    return {
        "active": queue_limiter.active,
        "waiting": queue_limiter.waiting,
        "max_concurrent": queue_limiter.max_concurrent,
        "connected_users": presence_manager.count,
    }
