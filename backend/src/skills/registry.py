"""Skill registry: loads YAML skill definitions and registers them as tools."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml


@dataclass
class SkillDefinition:
    name: str
    description: str
    trigger_patterns: list[str] = field(default_factory=list)
    required_tools: list[str] = field(default_factory=list)
    prompt_template: str = ""
    tags: list[str] = field(default_factory=list)


class SkillRegistry:
    def __init__(self) -> None:
        self._skills: dict[str, SkillDefinition] = {}
        self._definitions_dir = Path(__file__).parent / "definitions"

    @property
    def skills(self) -> dict[str, SkillDefinition]:
        return dict(self._skills)

    def load_all(self) -> int:
        """Load all YAML skill definitions. Returns count loaded."""
        if not self._definitions_dir.exists():
            return 0
        count = 0
        for path in self._definitions_dir.glob("*.yaml"):
            try:
                with open(path) as f:
                    data = yaml.safe_load(f)
                if data:
                    skill = SkillDefinition(
                        name=data.get("name", path.stem),
                        description=data.get("description", ""),
                        trigger_patterns=data.get("trigger_patterns", []),
                        required_tools=data.get("required_tools", []),
                        prompt_template=data.get("prompt_template", ""),
                        tags=data.get("tags", []),
                    )
                    self._skills[skill.name] = skill
                    count += 1
            except Exception as e:
                print(f"[skills] Failed to load {path.name}: {e}")
        print(f"[skills] Loaded {count} skill(s)")
        return count

    def match(self, query: str) -> list[SkillDefinition]:
        """Find skills whose trigger patterns match the query."""
        matches = []
        for skill in self._skills.values():
            for pattern in skill.trigger_patterns:
                if re.search(pattern, query, re.IGNORECASE):
                    matches.append(skill)
                    break
        return matches

    def get(self, name: str) -> SkillDefinition | None:
        return self._skills.get(name)

    def list_all(self) -> list[dict[str, Any]]:
        return [
            {
                "name": s.name,
                "description": s.description,
                "tags": s.tags,
                "trigger_patterns": s.trigger_patterns,
            }
            for s in self._skills.values()
        ]

    def get_full(self, name: str) -> dict[str, Any] | None:
        """Return all fields for a skill, including prompt_template and required_tools."""
        skill = self._skills.get(name)
        if skill is None:
            return None
        return {
            "name": skill.name,
            "description": skill.description,
            "trigger_patterns": skill.trigger_patterns,
            "required_tools": skill.required_tools,
            "prompt_template": skill.prompt_template,
            "tags": skill.tags,
        }

    def create(self, data: dict[str, Any]) -> SkillDefinition:
        """Create a new skill, write YAML to definitions dir, and add to registry."""
        self._definitions_dir.mkdir(parents=True, exist_ok=True)
        skill = SkillDefinition(
            name=data["name"],
            description=data.get("description", ""),
            trigger_patterns=data.get("trigger_patterns", []),
            required_tools=data.get("required_tools", []),
            prompt_template=data.get("prompt_template", ""),
            tags=data.get("tags", []),
        )
        yaml_path = self._definitions_dir / f"{skill.name}.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(
                {
                    "name": skill.name,
                    "description": skill.description,
                    "trigger_patterns": skill.trigger_patterns,
                    "required_tools": skill.required_tools,
                    "prompt_template": skill.prompt_template,
                    "tags": skill.tags,
                },
                f,
                default_flow_style=False,
                sort_keys=False,
            )
        self._skills[skill.name] = skill
        return skill

    def update(self, name: str, data: dict[str, Any]) -> SkillDefinition | None:
        """Update an existing skill's YAML file and in-memory entry."""
        if name not in self._skills:
            return None
        existing = self._skills[name]
        existing.description = data.get("description", existing.description)
        existing.trigger_patterns = data.get("trigger_patterns", existing.trigger_patterns)
        existing.required_tools = data.get("required_tools", existing.required_tools)
        existing.prompt_template = data.get("prompt_template", existing.prompt_template)
        existing.tags = data.get("tags", existing.tags)
        yaml_path = self._definitions_dir / f"{name}.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(
                {
                    "name": existing.name,
                    "description": existing.description,
                    "trigger_patterns": existing.trigger_patterns,
                    "required_tools": existing.required_tools,
                    "prompt_template": existing.prompt_template,
                    "tags": existing.tags,
                },
                f,
                default_flow_style=False,
                sort_keys=False,
            )
        return existing

    def delete(self, name: str) -> bool:
        """Delete a skill's YAML file and remove from in-memory registry."""
        if name not in self._skills:
            return False
        yaml_path = self._definitions_dir / f"{name}.yaml"
        if yaml_path.exists():
            yaml_path.unlink()
        del self._skills[name]
        return True


skill_registry = SkillRegistry()
