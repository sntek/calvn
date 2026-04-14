"""Chat endpoint using Pydantic AI's VercelAIAdapter for streaming."""
import re
import time
import uuid

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from starlette.responses import Response

from pydantic_ai.ui.vercel_ai import VercelAIAdapter

from ..agents import jira_agent, oracle_agent, orchestrator
from ..oracle.parse import parse_connection_request
from ..oracle.setup import register_connection
from ..queue import queue_limiter

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


@router.post("/api/chat")
async def chat(request: Request) -> Response:
    body = await request.json()
    messages = body.get("messages", [])
    session_id = body.get("sessionId", str(uuid.uuid4()))

    if not messages:
        return StreamingResponse(
            iter(["data: {}\n\n"]),
            media_type="text/event-stream",
        )

    user_message = messages[-1].get("content", "") if messages else ""

    # Intercept connection requests locally (credentials never sent to LLM)
    connect_reply = await _handle_connect_request(user_message)
    if connect_reply is not None:
        async def _connect_stream():
            yield f'0:"{connect_reply}"\n'
            yield 'e:{{"finishReason":"stop"}}\n'
            yield f'd:{{"finishReason":"stop","usage":{{"promptTokens":0,"completionTokens":0}}}}\n'
        return StreamingResponse(_connect_stream(), media_type="text/event-stream")

    # Queue management
    position = await queue_limiter.acquire()

    start = time.monotonic()
    try:
        async with oracle_agent.run_mcp_servers(), jira_agent.run_mcp_servers():
            return await VercelAIAdapter.dispatch_request(
                request,
                agent=orchestrator,
                prompt=user_message,
            )
    finally:
        elapsed = time.monotonic() - start
        queue_limiter.release()
        print(f"[chat] {elapsed:.2f}s | session={session_id}")
