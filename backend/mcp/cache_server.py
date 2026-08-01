from mcp.server import Server
from mcp.types import Tool, TextContent
from typing import Any
import json
from .registry import cache_registry

mcp_cache_server = Server("opencase-cache")

@mcp_cache_server.list_tools()
async def handle_list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_cache",
            description="Retrieve an AI response from cache",
            inputSchema={
                "type": "object",
                "properties": {
                    "key": {"type": "string", "description": "The cache key"}
                },
                "required": ["key"]
            }
        ),
        Tool(
            name="set_cache",
            description="Store an AI response in cache",
            inputSchema={
                "type": "object",
                "properties": {
                    "key": {"type": "string"},
                    "value": {"type": "string"},
                    "ttl": {"type": "integer"}
                },
                "required": ["key", "value"]
            }
        ),
        Tool(
            name="get_cache_stats",
            description="Get cache statistics (hits, misses, etc.)",
            inputSchema={"type": "object", "properties": {}}
        )
    ]

@mcp_cache_server.call_tool()
async def handle_call_tool(name: str, arguments: dict[str, Any] | None) -> list[TextContent]:
    if not arguments:
        arguments = {}
        
    if name == "get_cache":
        val = cache_registry.get(arguments["key"])
        return [TextContent(type="text", text=val if val else "")]
        
    elif name == "set_cache":
        ttl = arguments.get("ttl", 3600)
        cache_registry.set(arguments["key"], arguments["value"], ttl=ttl)
        return [TextContent(type="text", text="OK")]
        
    elif name == "get_cache_stats":
        stats = cache_registry.get_stats()
        return [TextContent(type="text", text=json.dumps(stats))]
        
    raise ValueError(f"Unknown tool: {name}")

# For direct access within FastAPI, it might be simpler to expose synchronous or direct helper functions
# But we can also use these tools via standard function calls if needed.
