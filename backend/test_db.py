import asyncio, sys, traceback

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import init_db
try:
    asyncio.run(init_db())
    with open("db_result.txt", "w") as f:
        f.write("SUCCESS\n")
except Exception as e:
    with open("db_result.txt", "w") as f:
        f.write(f"ERROR: {type(e).__name__}: {e}\n\n")
        traceback.print_exc(file=f)
