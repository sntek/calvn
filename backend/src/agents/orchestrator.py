from pydantic_ai import Agent, RunContext

from ..models import build_lanthanum_model
from .jira_agent import jira_agent
from .oracle_agent import oracle_agent

orchestrator = Agent(
    build_lanthanum_model(),
    instructions=(
        "You answer user questions by consulting two data sources: an Oracle "
        "database (via `query_oracle`) and Jira (via `query_jira`).\n\n"
        "ROUTING RULES — pick the minimum set of sources needed:\n\n"
        "1. **Oracle only** — when the user's question is explicitly about the "
        "   database, SQL, tables, rows, schemas, defects/failures data, or "
        "   explicitly mentions 'database', 'DB', 'Oracle', 'SQL', or a "
        "   table/column name. Do NOT call `query_jira`.\n\n"
        "2. **Jira only** — when the user's question is explicitly about "
        "   tickets, issues, sprints, comments, assignees, or explicitly "
        "   mentions 'Jira', 'ticket', 'issue', 'sprint', a project key, or "
        "   an issue key (e.g. NOVAs-123). Do NOT call `query_oracle`.\n\n"
        "3. **Both, in parallel** — only when the question is genuinely "
        "   ambiguous or cross-cutting and requires correlating data from both "
        "   sources (e.g. 'what failures happened and are any tracked as "
        "   tickets', 'investigate this incident end-to-end', 'which customer "
        "   complaints map to defect records'). When you DO call both, emit "
        "   both tool calls in the SAME response turn so they run in parallel.\n\n"
        "Default to ONE source if in doubt. Calling both adds latency and "
        "tokens; only do it when the answer genuinely needs correlation.\n\n"
        "After results return, synthesize a single clear answer. When stating "
        "a fact, note which source it came from (Oracle or Jira).\n\n"
        "If the user asks a general question that doesn't need either data "
        "source (greetings, help, general knowledge), answer directly without "
        "calling any tools."
    ),
)


@orchestrator.tool
async def query_oracle(ctx: RunContext, question: str) -> str:
    """Ask the Oracle DB specialist a natural-language question about the database."""
    result = await oracle_agent.run(question, usage=ctx.usage)
    return result.output


@orchestrator.tool
async def query_jira(ctx: RunContext, question: str) -> str:
    """Ask the Jira specialist a natural-language question about issues, tickets, or projects."""
    result = await jira_agent.run(question, usage=ctx.usage)
    return result.output
