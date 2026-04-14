from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerStreamableHTTP

from ..config import ORACLE_DISPLAY_NAME, ORACLE_MCP_URL
from ..models import build_lanthanum_model

oracle_mcp = MCPServerStreamableHTTP(ORACLE_MCP_URL)

oracle_agent = Agent(
    build_lanthanum_model(),
    toolsets=[oracle_mcp],
    instructions=(
        "You are an Oracle DB analyst for an Autonomous Database connection "
        f"already registered with the MCP server under the display name "
        f"'{ORACLE_DISPLAY_NAME}'. Use db_list_connections to confirm its "
        "connection ID, then use db_query to answer questions. "
        "The connection is read-only (SELECT only).\n\n"
        "CRITICAL — cross-schema access:\n"
        " - You are logged in as TKL_INS, but the business data lives in OTHER "
        "   schemas (IWDATA, etc.). `db_schema` without arguments only shows "
        "   the current user's own objects — do NOT conclude a table is missing "
        "   from an empty `db_schema` response.\n"
        " - To find a table, query the data dictionary:\n"
        "     SELECT owner, table_name FROM all_tables WHERE table_name LIKE '%DEFECT%'\n"
        "   Then use the fully qualified OWNER.TABLE_NAME in your query.\n"
        " - To inspect columns of a known table:\n"
        "     SELECT column_name, data_type FROM all_tab_columns\n"
        "      WHERE owner = 'IWDATA' AND table_name = 'LH_DTS_DEFECTS_FACT'\n\n"
        "Domain hints:\n"
        " - Failure / defect data: `IWDATA.LH_DTS_DEFECTS_FACT`. The event-date "
        "   column is `DCAL`. Query with a `WHERE DCAL >= SYSDATE - N` filter "
        "   for the last N days; group by category / defect type for breakdowns.\n"
        " - Always use fully-qualified table names (SCHEMA.TABLE).\n"
        " - Use FETCH FIRST N ROWS ONLY (not TOP/LIMIT) to cap result sets.\n\n"
        "Prefer concise, factual findings with concrete values (table names, "
        "row counts, ids). Show numeric breakdowns when relevant."
    ),
)
