"""Skills CRUD endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..skills import skill_registry

router = APIRouter()


class SkillBody(BaseModel):
    name: str
    description: str = ""
    trigger_patterns: list[str] = []
    required_tools: list[str] = []
    prompt_template: str = ""
    tags: list[str] = []


@router.get("/api/skills")
async def list_skills():
    return {"skills": skill_registry.list_all()}


@router.get("/api/skills/{name}")
async def get_skill(name: str):
    skill = skill_registry.get_full(name)
    if skill is None:
        raise HTTPException(status_code=404, detail=f"Skill '{name}' not found")
    return skill


@router.post("/api/skills", status_code=201)
async def create_skill(body: SkillBody):
    if skill_registry.get(body.name) is not None:
        raise HTTPException(status_code=409, detail=f"Skill '{body.name}' already exists")
    skill = skill_registry.create(body.model_dump())
    return skill_registry.get_full(skill.name)


@router.put("/api/skills/{name}")
async def update_skill(name: str, body: SkillBody):
    updated = skill_registry.update(name, body.model_dump())
    if updated is None:
        raise HTTPException(status_code=404, detail=f"Skill '{name}' not found")
    return skill_registry.get_full(name)


@router.delete("/api/skills/{name}")
async def delete_skill(name: str):
    deleted = skill_registry.delete(name)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Skill '{name}' not found")
    return {"deleted": True}
