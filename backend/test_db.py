import asyncio, sys, traceback
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test_url(name, url, connect_args=None):
    print(f"Testing {name}: {url}", flush=True)
    try:
        kwargs = {}
        if connect_args:
            kwargs["connect_args"] = connect_args
        engine = create_async_engine(url, **kwargs)
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT version();"))
            row = res.fetchone()
            print(f"  -> SUCCESS: {row[0][:50]}", flush=True)
            await engine.dispose()
            return f"{name}: SUCCESS ({row[0][:40]})"
    except Exception as e:
        print(f"  -> FAILED: {type(e).__name__}: {e}", flush=True)
        return f"{name}: ERROR {type(e).__name__}: {e}"

async def main():
    results = []
    
    url_base = settings.DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")
    if url_base.startswith("postgres://"):
        url_base = url_base.replace("postgres://", "postgresql+psycopg://", 1)
    elif url_base.startswith("postgresql://") and not url_base.startswith("postgresql+"):
        url_base = url_base.replace("postgresql://", "postgresql+psycopg://", 1)

    # 1. Pooler 6543 + sslmode=require + prepare_threshold=0
    r1 = await test_url("Pooler 6543 + sslmode=require + prepare_threshold=0", url_base, connect_args={"sslmode": "require", "prepare_threshold": 0})
    results.append(r1)

    # 2. Pooler 5432 (Session) + sslmode=require + prepare_threshold=0
    url_5432 = url_base.replace(":6543", ":5432")
    r2 = await test_url("Pooler 5432 + sslmode=require + prepare_threshold=0", url_5432, connect_args={"sslmode": "require", "prepare_threshold": 0})
    results.append(r2)

    # 3. Direct URL + sslmode=require
    url_direct = getattr(settings, "DIRECT_URL", "")
    if url_direct.startswith("postgres://"):
        url_direct = url_direct.replace("postgres://", "postgresql+psycopg://", 1)
    elif url_direct.startswith("postgresql://") and not url_direct.startswith("postgresql+"):
        url_direct = url_direct.replace("postgresql://", "postgresql+psycopg://", 1)
    
    if url_direct:
        r3 = await test_url("Direct 5432 + sslmode=require", url_direct, connect_args={"sslmode": "require"})
        results.append(r3)

    print("\n--- SUMMARY ---", flush=True)
    for r in results:
        print(r, flush=True)

if __name__ == "__main__":
    asyncio.run(main())


