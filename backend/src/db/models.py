from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Session(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: str = Field(default="anonymous", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    message_count: int = Field(default=0)


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    role: str  # "user" | "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UsageMetric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    message_id: Optional[int] = None
    elapsed_s: float = 0.0
    llm_calls: int = 0
    tool_calls: int = 0
    total_tokens: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    agents_used: str = ""  # comma-separated: "oracle", "jira", "both"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Skill(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str = ""
    trigger_patterns: str = ""  # JSON array of regex patterns
    definition_path: str = ""
    usage_count: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserPrefs(SQLModel, table=True):
    user_id: str = Field(primary_key=True)
    cloud_model: str = "azure/gpt-5.1"
    cloud_base_url: str = "http://lanthanum.global.tektronix.net:8080/openai"
    local_model: str = "local-model"
    local_base_url: str = "http://10.233.65.191:1234/v1"
    total_sessions: int = 0
    total_messages: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)
