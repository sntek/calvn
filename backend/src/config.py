import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BIFROST_BASE_URL = os.getenv("BIFROST_BASE_URL", "http://lanthanum.global.tektronix.net:8080/openai")
BIFROST_API_KEY = os.getenv("BIFROST_API_KEY", "dummy-api-key")
LANTHANUM_MODEL = os.getenv("LANTHANUM_MODEL", "azure/gpt-5.1")

QWEN_BASE_URL = os.getenv("QWEN_BASE_URL", "http://10.233.65.191:1234/v1")

ORACLE_MCP_URL = os.getenv("ORACLE_MCP_URL", "http://localhost:8081/mcp")
JIRA_MCP_URL = os.getenv("JIRA_MCP_URL", "http://lanthanum.global.tektronix.net:8080/mcp")

ORACLE_USER = os.getenv("ORACLE_USER")
ORACLE_PASSWORD = os.getenv("ORACLE_PASSWORD")
ORACLE_WALLET_DIR = os.getenv("ORACLE_WALLET_DIR")
ORACLE_TNS_ALIAS = os.getenv("ORACLE_TNS_ALIAS")
ORACLE_DISPLAY_NAME = os.getenv("ORACLE_DISPLAY_NAME", "tektestdb")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", "5"))

DB_PATH = Path(os.getenv("DB_PATH", "calvn.db"))
