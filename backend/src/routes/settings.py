"""User settings: AI endpoints, model selection, Jira project scope."""
from fastapi import APIRouter
from pydantic import BaseModel

from ..config import (
    BIFROST_BASE_URL,
    JIRA_DEFAULT_PROJECTS,
    LANTHANUM_MODEL,
    QWEN_BASE_URL,
)

router = APIRouter()


class SettingsResponse(BaseModel):
    cloud_model: str
    cloud_base_url: str
    local_model: str
    local_base_url: str
    jira_projects: list[str]


class SettingsUpdate(BaseModel):
    cloud_model: str | None = None
    cloud_base_url: str | None = None
    local_model: str | None = None
    local_base_url: str | None = None
    jira_projects: list[str] | None = None


# In-memory settings (per-process; persisted to DB in production)
_current_settings = SettingsResponse(
    cloud_model=LANTHANUM_MODEL,
    cloud_base_url=BIFROST_BASE_URL,
    local_model="local-model",
    local_base_url=QWEN_BASE_URL,
    jira_projects=list(JIRA_DEFAULT_PROJECTS),
)


def get_jira_projects() -> list[str]:
    """Return the current list of allowed Jira projects."""
    return list(_current_settings.jira_projects)


@router.get("/api/settings")
async def get_settings() -> SettingsResponse:
    return _current_settings


@router.put("/api/settings")
async def update_settings(update: SettingsUpdate) -> SettingsResponse:
    global _current_settings
    if update.cloud_model is not None:
        _current_settings.cloud_model = update.cloud_model
    if update.cloud_base_url is not None:
        _current_settings.cloud_base_url = update.cloud_base_url
    if update.local_model is not None:
        _current_settings.local_model = update.local_model
    if update.local_base_url is not None:
        _current_settings.local_base_url = update.local_base_url
    if update.jira_projects is not None:
        _current_settings.jira_projects = [
            p.strip() for p in update.jira_projects if p.strip()
        ]
    return _current_settings
