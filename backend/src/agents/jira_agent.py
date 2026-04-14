"""Jira specialist agent.

SECURITY BOUNDARY: This is the ONLY agent with Jira MCP attached.
It is backed by the local Qwen model — Jira data never leaves the local network.

PROJECT SCOPE: The allowed projects are configured in Settings and read
dynamically at query time via `instructions` as a callable.
"""
from pydantic_ai import Agent, RunContext
from pydantic_ai.mcp import MCPServerStreamableHTTP

from ..config import JIRA_MCP_URL
from ..models import build_qwen_model

jira_mcp = MCPServerStreamableHTTP(JIRA_MCP_URL)


def _build_jira_instructions(ctx: RunContext) -> str:
    """Build Jira agent instructions with the current allowed project list."""
    # Import here to avoid circular imports at module level
    from ..routes.settings import get_jira_projects

    projects = get_jira_projects()
    project_list = ", ".join(projects) if projects else "NOVAs"
    project_clause = " OR ".join(f'project = "{p}"' for p in projects)

    if len(projects) == 1:
        scope_text = (
            f"SCOPE — always restrict to the {projects[0]} project:\n"
            f" - Every JQL query you construct MUST include `project = {projects[0]}` as a "
            f"   clause (AND-ed with the user's other filters). Example:\n"
            f'     project = {projects[0]} AND status = "In Progress" ORDER BY updated DESC\n'
            f" - When a tool takes a `project_key` / `projectKey` / `project` argument, "
            f"   pass `{projects[0]}`.\n"
            f" - Do NOT list, search, or return issues from any other project even if "
            f"   the user's question is open-ended — scope to {projects[0]} only.\n"
            f" - If the user explicitly names a project not in your allowed list, "
            f"   tell them which projects you have access to ({project_list})."
        )
    else:
        scope_text = (
            f"SCOPE — restrict to these allowed projects: {project_list}\n"
            f" - Every JQL query you construct MUST include a project filter. "
            f"   If the user names a specific allowed project, use it. "
            f"   If the question is open-ended, search across all allowed projects:\n"
            f"     ({project_clause}) AND status = \"In Progress\" ORDER BY updated DESC\n"
            f" - When a tool takes a `project_key` / `projectKey` / `project` argument, "
            f"   pass the relevant project key from the allowed list.\n"
            f" - Do NOT list, search, or return issues from projects outside this list.\n"
            f" - If the user explicitly names a project not in your allowed list, "
            f"   tell them which projects you have access to ({project_list})."
        )

    return (
        "You are a Jira analyst. Use the available MCP tools to search issues, "
        "tickets, and comments. Return concise, factual findings with issue keys "
        "where relevant.\n\n"
        f"{scope_text}"
    )


jira_agent = Agent(
    build_qwen_model(),
    toolsets=[jira_mcp],
    instructions=_build_jira_instructions,
)
