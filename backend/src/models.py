from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from .config import (
    BIFROST_API_KEY,
    BIFROST_BASE_URL,
    LANTHANUM_MODEL,
    QWEN_BASE_URL,
)


def build_lanthanum_model(model_name: str = LANTHANUM_MODEL) -> OpenAIChatModel:
    """Cloud model via the Bifrost gateway. Safe for non-sensitive data."""
    provider = OpenAIProvider(base_url=BIFROST_BASE_URL, api_key=BIFROST_API_KEY)
    return OpenAIChatModel(model_name, provider=provider)


def build_qwen_model(model_name: str = "local-model") -> OpenAIChatModel:
    """Local LM Studio / Qwen model. Required for any agent that touches
    the Jira MCP server (sensitive data must not traverse the cloud)."""
    provider = OpenAIProvider(base_url=QWEN_BASE_URL, api_key="lm-studio")
    return OpenAIChatModel(model_name, provider=provider)
