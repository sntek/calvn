"""Chat endpoint using Pydantic AI's VercelAIAdapter for streaming.

CRITICAL: VercelAIAdapter.dispatch_request() returns a StreamingResponse whose
body is generated lazily — the agent runs, calls tools, and streams text INSIDE
the response body iterator, NOT before dispatch_request returns.

MCP server sessions must stay open for the entire lifetime of the stream.
We use Starlette's BackgroundTask to defer cleanup until AFTER the full
response body has been sent to the client.
"""
import asyncio
import json
import logging
import re
import time
import traceback
import uuid

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from starlette.background import BackgroundTask
from starlette.responses import Response

from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.response_types import MessageMetadataChunk

from ..agents import jira_agent, oracle_agent, orchestrator
from ..oracle.parse import parse_connection_request
from ..oracle.setup import register_connection
from ..queue import queue_limiter

logger = logging.getLogger("calvn.chat")
router = APIRouter()


async def _handle_connect_request(user_message: str) -> str | None:
    """If the message contains Oracle connection credentials, register locally."""
    req = parse_connection_request(user_message)
    if req is None:
        return None
    display_name = re.sub(r"_(low|medium|high)(_\w+)?$", "", req.alias, flags=re.I) or req.alias
    result = await register_connection(
        wallet_directory=req.wallet_directory,
        alias=req.alias,
        username=req.username,
        password=req.password,
        display_name=display_name,
        skip_if_exists=True,
    )
    status = "registered" if result.ok else "failed"
    return (
        f"Oracle ADB connection {status}. "
        f"Display name: {result.display_name or display_name}. "
        f"{result.message}"
    )


def _extract_last_user_message(body: dict) -> str:
    """Extract the last user message text from the Vercel AI SDK request body."""
    messages = body.get("messages", [])
    if not messages:
        return ""
    last = messages[-1]
    parts = last.get("parts", [])
    if parts:
        texts = [p.get("text", "") for p in parts if p.get("type") == "text"]
        return " ".join(texts)
    return last.get("content", "")


_V1_HEADERS = {"x-vercel-ai-ui-message-stream": "v1"}


def _usage_metadata(input_tokens: int = 0, output_tokens: int = 0) -> dict:
    """Build a messageMetadata dict with usage info for the AI SDK."""
    return {
        "usage": {
            "promptTokens": input_tokens,
            "completionTokens": output_tokens,
            "totalTokens": input_tokens + output_tokens,
        }
    }


def _v1_text_stream(text: str, metadata: dict | None = None):
    """Create a v1 message-stream response from plain text."""
    msg_id = str(uuid.uuid4())

    async def _stream():
        yield f"data: {json.dumps({'type': 'start'})}\n\n"
        yield f"data: {json.dumps({'type': 'start-step'})}\n\n"
        yield f"data: {json.dumps({'type': 'text-start', 'id': msg_id})}\n\n"
        yield f"data: {json.dumps({'type': 'text-delta', 'id': msg_id, 'delta': text})}\n\n"
        yield f"data: {json.dumps({'type': 'text-end', 'id': msg_id})}\n\n"
        yield f"data: {json.dumps({'type': 'finish-step'})}\n\n"
        yield f"data: {json.dumps({'type': 'finish', 'finishReason': 'stop', 'messageMetadata': metadata or {}})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        _stream(), media_type="text/event-stream", headers=_V1_HEADERS,
    )


def _error_stream(error_message: str):
    """Create a v1 message-stream that sends an error message as text."""
    return _v1_text_stream(error_message)



# ---------------------------------------------------------------------------
# Fast-path keyword router — skip the orchestrator LLM call when intent is
# obvious, saving 2 LLM round trips (route + synthesise).
# ---------------------------------------------------------------------------
_ORACLE_KEYWORDS = {"oracle", "database", "db", "sql", "table", "schema", "defect", "query", "rows", "column"}
_JIRA_KEYWORDS = {"jira", "ticket", "issue", "sprint", "assignee", "comment", "project key"}
_BOTH_KEYWORDS = {"connection", "connections", "services", "status", "check all", "health"}


def _fast_route(message: str) -> str | None:
    """Return 'oracle', 'jira', 'both', or None (fall through to orchestrator)."""
    lower = message.lower()

    # Broad "check everything" intent
    if any(kw in lower for kw in _BOTH_KEYWORDS):
        return "both"

    has_oracle = any(kw in lower for kw in _ORACLE_KEYWORDS)
    has_jira = any(kw in lower for kw in _JIRA_KEYWORDS)

    if has_oracle and has_jira:
        return "both"
    if has_oracle:
        return "oracle"
    if has_jira:
        return "jira"

    return None  # not obvious — let the orchestrator decide


def _run_fast_path(
    route: str,
    user_message: str,
    oracle_ctx,
    jira_ctx,
) -> Response:
    """Return a StreamingResponse immediately; run sub-agents inside the body
    iterator so the frontend sees headers right away and tokens as they arrive.

    Emits v1 tool-input/output events so the frontend's AgentActivity component
    can show real-time progress while the agents work.
    """

    async def _stream():
        msg_id = str(uuid.uuid4())

        yield f"data: {json.dumps({'type': 'start'})}\n\n"
        yield f"data: {json.dumps({'type': 'start-step'})}\n\n"

        # Build the list of agents to call, each with a unique tool call ID
        agents: list[dict] = []

        if route in ("oracle", "both") and oracle_ctx is not None:
            agents.append({
                "name": "query_oracle",
                "label": "Oracle DB",
                "call_id": f"call_{uuid.uuid4().hex[:12]}",
                "coro": oracle_agent.run(user_message),
            })
        if route in ("jira", "both") and jira_ctx is not None:
            agents.append({
                "name": "query_jira",
                "label": "Jira",
                "call_id": f"call_{uuid.uuid4().hex[:12]}",
                "coro": jira_agent.run(user_message),
            })

        if not agents:
            err = "No data sources available. Check that MCP servers are running."
            yield f"data: {json.dumps({'type': 'text-start', 'id': msg_id})}\n\n"
            yield f"data: {json.dumps({'type': 'text-delta', 'id': msg_id, 'delta': err})}\n\n"
            yield f"data: {json.dumps({'type': 'text-end', 'id': msg_id})}\n\n"
            yield f"data: {json.dumps({'type': 'finish-step'})}\n\n"
            yield f"data: {json.dumps({'type': 'finish', 'finishReason': 'stop'})}\n\n"
            yield "data: [DONE]\n\n"
            return

        # Emit tool-input-start + tool-input-available for each agent.
        # The frontend will immediately show "Querying Oracle database..." etc.
        args_obj = {"question": user_message}
        args_json = json.dumps(args_obj)
        for agent in agents:
            yield f"data: {json.dumps({'type': 'tool-input-start', 'toolCallId': agent['call_id'], 'toolName': agent['name']})}\n\n"
            yield f"data: {json.dumps({'type': 'tool-input-delta', 'toolCallId': agent['call_id'], 'inputTextDelta': args_json})}\n\n"
            yield f"data: {json.dumps({'type': 'tool-input-available', 'toolCallId': agent['call_id'], 'toolName': agent['name'], 'input': args_obj})}\n\n"

        # Run agents in parallel — the stream pauses here while they work,
        # but the frontend already has the "active" tool indicators.
        results = await asyncio.gather(
            *[a["coro"] for a in agents], return_exceptions=True,
        )

        # Emit tool-output-available for each completed agent
        parts: list[str] = []
        total_in = 0
        total_out = 0
        for agent, result in zip(agents, results):
            if isinstance(result, Exception):
                parts.append(f"**{agent['label']}:** Error — {result}")
                yield f"data: {json.dumps({'type': 'tool-output-available', 'toolCallId': agent['call_id'], 'output': f'Error: {result}'})}\n\n"
            else:
                parts.append(f"**{agent['label']}:**\n{result.output}")
                u = result.usage()
                total_in += u.input_tokens or 0
                total_out += u.output_tokens or 0
                yield f"data: {json.dumps({'type': 'tool-output-available', 'toolCallId': agent['call_id'], 'output': 'Query completed successfully'})}\n\n"

        # End the tool step, start a new step for the text response
        yield f"data: {json.dumps({'type': 'finish-step'})}\n\n"
        yield f"data: {json.dumps({'type': 'start-step'})}\n\n"

        combined = "\n\n---\n\n".join(parts)
        metadata = _usage_metadata(total_in, total_out)

        yield f"data: {json.dumps({'type': 'text-start', 'id': msg_id})}\n\n"
        yield f"data: {json.dumps({'type': 'text-delta', 'id': msg_id, 'delta': combined})}\n\n"
        yield f"data: {json.dumps({'type': 'text-end', 'id': msg_id})}\n\n"
        yield f"data: {json.dumps({'type': 'finish-step'})}\n\n"
        yield f"data: {json.dumps({'type': 'finish', 'finishReason': 'stop', 'messageMetadata': metadata})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        _stream(), media_type="text/event-stream", headers=_V1_HEADERS,
    )


@router.post("/api/chat")
async def chat(request: Request) -> Response:
    # Read the raw body once; peek for interceptors, then pass through.
    raw_body = await request.body()

    try:
        body = json.loads(raw_body)
    except (json.JSONDecodeError, ValueError):
        body = {}

    messages = body.get("messages", [])
    session_id = body.get("sessionId", str(uuid.uuid4()))

    if not messages:
        return _error_stream("No messages received. Please type a message and try again.")

    user_message = _extract_last_user_message(body)
    logger.info(f"[chat] Received: {user_message[:100]}...")

    # Intercept connection requests locally (credentials never sent to LLM)
    connect_reply = await _handle_connect_request(user_message)
    if connect_reply is not None:
        return _error_stream(connect_reply)

    # Queue management
    await queue_limiter.acquire()
    start = time.monotonic()

    # Restore the body so the adapter can read it
    request._body = raw_body

    # Open MCP sessions for sub-agents IN PARALLEL before getting the
    # streaming response.  These stay open because cleanup is deferred to a
    # BackgroundTask that runs AFTER the response body is fully sent.
    oracle_ctx = None
    jira_ctx = None

    async def _open_oracle():
        ctx = oracle_agent.run_mcp_servers()
        await ctx.__aenter__()
        return ctx

    async def _open_jira():
        ctx = jira_agent.run_mcp_servers()
        await ctx.__aenter__()
        return ctx

    try:
        # Fire both MCP handshakes concurrently
        oracle_result, jira_result = await asyncio.gather(
            _open_oracle(), _open_jira(), return_exceptions=True,
        )

        if isinstance(oracle_result, Exception):
            logger.warning(f"[chat] Oracle MCP unavailable: {oracle_result}")
        else:
            oracle_ctx = oracle_result

        if isinstance(jira_result, Exception):
            logger.warning(f"[chat] Jira MCP unavailable: {jira_result}")
        else:
            jira_ctx = jira_result

        logger.info("[chat] MCP sessions ready")

        # --- Fast-path: bypass the orchestrator when routing is obvious ------
        route = _fast_route(user_message)
        if route is not None:
            logger.info(f"[chat] Fast-path route: {route}")
            response = _run_fast_path(
                route, user_message, oracle_ctx, jira_ctx,
            )
        else:
            # Fall through to full orchestrator (3+ LLM round trips)
            logger.info("[chat] Orchestrator path")

            async def _on_complete(result):
                """Yield usage metadata so the frontend can display token counts."""
                u = result.usage()
                yield MessageMetadataChunk(
                    message_metadata=_usage_metadata(
                        u.input_tokens or 0, u.output_tokens or 0,
                    ),
                )

            response = await VercelAIAdapter.dispatch_request(
                request,
                agent=orchestrator,
                sdk_version=6,
                on_complete=_on_complete,
            )

    except Exception as e:
        # If we fail before getting a response, clean up now
        logger.error(f"[chat] Orchestrator error: {e}\n{traceback.format_exc()}")
        if jira_ctx is not None:
            try:
                await jira_ctx.__aexit__(None, None, None)
            except Exception:
                pass
        if oracle_ctx is not None:
            try:
                await oracle_ctx.__aexit__(None, None, None)
            except Exception:
                pass
        queue_limiter.release()
        return _error_stream(
            f"Error: {type(e).__name__}: {e}. "
            "Check that AI endpoints are configured correctly in Settings."
        )

    # Attach cleanup as a BackgroundTask — this runs AFTER the full response
    # body has been sent to the client, keeping MCP sessions alive during
    # the entire streaming duration.
    async def _cleanup():
        elapsed = time.monotonic() - start
        if jira_ctx is not None:
            try:
                await jira_ctx.__aexit__(None, None, None)
                logger.info("[chat] Jira MCP session closed")
            except Exception:
                pass
        if oracle_ctx is not None:
            try:
                await oracle_ctx.__aexit__(None, None, None)
                logger.info("[chat] Oracle MCP session closed")
            except Exception:
                pass
        queue_limiter.release()
        logger.info(f"[chat] {elapsed:.2f}s | session={session_id}")

    response.background = BackgroundTask(_cleanup)
    return response
