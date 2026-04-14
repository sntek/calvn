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


skill_registry = SkillRegistry()
