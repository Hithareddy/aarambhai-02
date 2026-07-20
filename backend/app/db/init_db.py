"""
Database initialization script.

Run this script to create initial database schema and seed data.
"""
import asyncio

from app.db.session import init_db


async def main() -> None:
    """Initialize the database."""
    print("Initializing database...")
    await init_db()
    print("Database initialized successfully!")


if __name__ == "__main__":
    asyncio.run(main())
