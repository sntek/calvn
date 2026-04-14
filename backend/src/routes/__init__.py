from .analytics import router as analytics_router
from .chat import router as chat_router
from .presence import router as presence_router
from .settings import router as settings_router
from .skills import router as skills_router
from .status import router as status_router

__all__ = [
    "analytics_router",
    "chat_router",
    "presence_router",
    "settings_router",
    "skills_router",
    "status_router",
]
