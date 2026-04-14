"""Skills browsing endpoint."""
from fastapi import APIRouter

from ..skills import skill_registry

router = APIRouter()


@router.get("/api/skills")
async def list_skills():
    return {"skills": skill_registry.list_all()}
