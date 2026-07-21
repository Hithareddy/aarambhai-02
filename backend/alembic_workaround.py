import asyncio
import sys
import alembic.config

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

args = ["--raiseerr", "revision", "--autogenerate", "-m", "Sprint 7 learning modules"]
alembic.config.main(argv=args)
