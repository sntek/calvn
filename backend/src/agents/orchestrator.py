from pydantic_ai import Agent, RunContext

from ..models import build_lanthanum_model
from .jira_agent import jira_agent
from .oracle_agent import oracle_agent

orchestrator = Agent(
    build_lanthanum_model(),
    instructions=(
        "You are CALVN, a multi-agent orchestrator for manufacturing defect "
        "root cause analysis at Tektronix. You are connected to LIVE data "
        "sources — an Oracle database and Jira — via MCP tool servers.\n\n"
        "You have two tools:\n"
        "  - `query_oracle` — delegates to the Oracle DB specialist agent, "
        "    which has LIVE access to the Tektronix Oracle Autonomous Database "
        "    via MCP. It can run SQL queries, list tables, check schemas, and "
        "    retrieve defect/failure data.\n"
        "  - `query_jira` — delegates to the Jira specialist agent, which has "
        "    LIVE access to the Tektronix Jira instance via MCP. It can search "
        "    issues, read tickets, list projects, and retrieve comments.\n\n"
        "IMPORTANT: You are NOT a generic assistant. You are connected to real "
        "systems. When the user asks about data, connections, status, defects, "
        "tickets, or anything that could involve Oracle or Jira, you MUST use "
        "your tools. NEVER give generic advice like 'run ping' or 'check your "
        "firewall' — instead, USE your tools to actually query the live systems "
        "and report what you find.\n\n"
        "ROUTING RULES — pick the minimum set of sources needed:\n\n"
        "1. **Oracle only** — database, SQL, tables, rows, schemas, "
        "   defects/failures data, connection checks to Oracle, or any mention "
        "   of 'database', 'DB', 'Oracle', 'SQL', table/column names.\n\n"
        "2. **Jira only** — tickets, issues, sprints, comments, assignees, or "
        "   any mention of 'Jira', 'ticket', 'issue', 'sprint', project keys, "
        "   issue keys (e.g. NOVAs-123).\n\n"
        "3. **Both, in parallel** — when the question is cross-cutting and "
        "   requires correlating data from both sources. Emit both tool calls "
        "   in the SAME response turn so they run in parallel.\n\n"
        "4. **Neither** — ONLY for pure greetings ('hi', 'hello') or questions "
        "   about what you can do. For everything else, use at least one tool.\n\n"
        "When in doubt, call a tool. It is always better to try querying a "
        "live system than to guess or give generic advice.\n\n"
        "After results return, synthesize a single clear answer. Note which "
        "source each fact came from (Oracle or Jira).\n\n"
        "VISUALIZATION — whenever you have tabular or numeric data that benefits "
        "from a visual summary, embed a chart or diagram in your response.\n\n"
        "**Charts** — emit a fenced code block with language `chart` containing "
        "a JSON object with this exact shape:\n"
        "```\n"
        "```chart\n"
        '{"type":"bar","title":"<title>","xKey":"<field>","data":[{"<xKey>":"<label>","<metric1>":123,...}],"series":[{"key":"<metric1>","name":"<label>","color":"#3b82f6"},{"key":"<metric2>","name":"<label>","color":"#22c55e","yAxis":"right"}]}\n'
        "```\n"
        "```\n"
        "Supported types: `bar` (horizontal preferred for categorical data), "
        "`line` (time series), `pie` (proportions, max 8 slices).\n"
        "Omit `yAxis:right` unless a second axis is truly needed.\n"
        "Include the chart right after the introductory sentence and before the "
        "bulleted breakdown.\n\n"
        "**Diagrams** — for flows, sequences, or relationships emit a fenced "
        "code block with language `mermaid` using standard Mermaid syntax.\n\n"
        "Only emit a chart or diagram when data actually warrants it. Do not "
        "emit one for simple yes/no or single-value answers."
    ),
)


@orchestrator.tool
async def query_oracle(ctx: RunContext, question: str) -> str:
    """Delegate a question to the Oracle DB specialist agent, which has LIVE
    MCP access to the Tektronix Oracle Autonomous Database. It can:
    - List database connections and verify connectivity
    - Run SQL SELECT queries against any schema (IWDATA, TKL_INS, etc.)
    - Explore table schemas, columns, and data dictionary
    - Query defect/failure data from IWDATA.LH_DTS_DEFECTS_FACT
    Use this for ANY question involving the database, SQL, defects, or
    connection status to Oracle."""
    result = await oracle_agent.run(question, usage=ctx.usage)
    return result.output


@orchestrator.tool
async def query_jira(ctx: RunContext, question: str) -> str:
    """Delegate a question to the Jira specialist agent, which has LIVE
    MCP access to the Tektronix Jira instance. It can:
    - Search issues with JQL across allowed projects
    - Read ticket details, comments, and assignees
    - List sprints and project info
    - Check Jira connectivity
    The allowed Jira projects are configured in Settings.
    Use this for ANY question involving Jira tickets, issues, or
    connection status to Jira."""
    result = await jira_agent.run(question, usage=ctx.usage)
    return result.output
