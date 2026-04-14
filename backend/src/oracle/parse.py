"""Parse Oracle Autonomous DB connection-request messages."""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class ConnectionRequest:
    alias: str
    username: str
    password: str
    wallet_directory: str
    host: str | None = None
    port: int | None = None
    service_name: str | None = None


_TNS_HEADER = re.compile(
    r"(?P<alias>[A-Za-z][A-Za-z0-9_]*)\s*=\s*\(\s*description\s*=",
    re.IGNORECASE,
)
_WALLET = re.compile(r"my_wallet_directory\s*=\s*([^)\s]+)", re.IGNORECASE)
_HOST = re.compile(r"\bhost\s*=\s*([^)\s]+)", re.IGNORECASE)
_PORT = re.compile(r"\bport\s*=\s*(\d+)", re.IGNORECASE)
_SERVICE = re.compile(r"service_name\s*=\s*([^)\s]+)", re.IGNORECASE)
_USER = re.compile(
    r"(?:^|\n)\s*user(?:name)?\s*[:=]?\s*\n?\s*([^\s\n]+)",
    re.IGNORECASE,
)
_PASSWORD = re.compile(
    r"(?:^|\n)\s*password\s*[:=]?\s*\n?\s*([^\s\n]+)",
    re.IGNORECASE,
)


def _normalize_unc(path: str) -> str:
    if path.startswith("\\\\"):
        return path
    if path.startswith("\\") and not path.startswith("\\\\"):
        body = path.lstrip("\\")
        first_segment = body.split("\\", 1)[0]
        if "." in first_segment or first_segment.lower() in {"global", "server"}:
            return "\\\\" + body
    return path


def parse_connection_request(message: str) -> ConnectionRequest | None:
    tns_match = _TNS_HEADER.search(message)
    wallet_match = _WALLET.search(message)
    user_match = _USER.search(message)
    pwd_match = _PASSWORD.search(message)

    if not (tns_match and wallet_match and user_match and pwd_match):
        return None

    return ConnectionRequest(
        alias=tns_match.group("alias").strip(),
        username=user_match.group(1).strip(),
        password=pwd_match.group(1).strip(),
        wallet_directory=_normalize_unc(wallet_match.group(1).strip()),
        host=(_HOST.search(message).group(1).strip() if _HOST.search(message) else None),
        port=(int(_PORT.search(message).group(1)) if _PORT.search(message) else None),
        service_name=(
            _SERVICE.search(message).group(1).strip() if _SERVICE.search(message) else None
        ),
    )
