"""
Launcher for FastAPI uvicorn server with explicit SelectorEventLoop instance.
"""
import sys
import asyncio
import uvicorn
from app.main import app

if __name__ == "__main__":
    config = uvicorn.Config(app=app, host="127.0.0.1", port=8000, loop="asyncio")
    server = uvicorn.Server(config)

    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        loop = asyncio.SelectorEventLoop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(server.serve())
    else:
        server.run()
