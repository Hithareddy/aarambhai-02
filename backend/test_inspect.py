import asyncio, sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import event
from app.db.session import engine

@event.listens_for(engine.sync_engine, "connect")
def _inspect(dbapi_connection, connection_record):
    with open("conn_inspect.txt", "w") as f:
        f.write(f"type: {type(dbapi_connection)}\n")
        f.write(f"dir: {[a for a in dir(dbapi_connection) if not a.startswith('__')]}\n")
        # Check for nested connection
        for attr in ['_connection', 'dbapi_connection', 'connection', 'driver_connection', '_conn']:
            val = getattr(dbapi_connection, attr, 'NOT FOUND')
            f.write(f"{attr}: {type(val)} -> {val}\n")

async def test():
    async with engine.connect() as conn:
        pass

asyncio.run(test())
