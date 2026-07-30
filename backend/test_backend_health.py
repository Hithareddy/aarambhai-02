"""
Health check script for FastAPI backend.
"""
import asyncio
import sys
import httpx

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


async def check_health():
    print("=== Testing FastAPI Backend Server Health ===")
    url = "http://127.0.0.1:8000/docs"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url)
            print(f"Backend HTTP Docs Status: {resp.status_code}")
    except Exception as e:
        print(f"Backend Server Connection Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_health())
