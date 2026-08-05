"""
Seed demo accounts into aarambh_local.db using bcrypt (same as the app).
Creates testuser002@gmail.com with password  TestPass@123
"""
import sqlite3
import uuid
from datetime import datetime

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_USERS = [
    {
        "email": "testuser002@gmail.com",
        "full_name": "Test User 002",
        "password": "TestPass@123",
        "is_superuser": 0,
    },
    {
        "email": "testuser201@gmail.com",
        "full_name": "Test User 201",
        "password": "TestPass@123",
        "is_superuser": 0,
    },
    {
        "email": "admin@aarambh.ai",
        "full_name": "Admin User",
        "password": "Admin@123",
        "is_superuser": 1,
    },
]

DB_PATH = "aarambh_local.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

now = datetime.utcnow().isoformat()

for u in DEMO_USERS:
    cur.execute("SELECT id FROM users WHERE email = ?", (u["email"],))
    row = cur.fetchone()
    hashed = pwd_context.hash(u["password"])
    if row:
        cur.execute(
            "UPDATE users SET hashed_password=?, full_name=?, is_active=1, is_verified=1, updated_at=? WHERE email=?",
            (hashed, u["full_name"], now, u["email"]),
        )
        print(f"Updated: {u['email']}")
    else:
        uid = str(uuid.uuid4())
        cur.execute(
            """INSERT INTO users (id, email, full_name, hashed_password, is_active, is_verified, is_superuser, created_at, updated_at)
               VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?)""",
            (uid, u["email"], u["full_name"], hashed, u["is_superuser"], now, now),
        )
        print(f"Created: {u['email']}")
    print(f"  password={u['password']}  hash_prefix={hashed[:20]}")

conn.commit()
conn.close()
print("\nDone. All demo accounts seeded with documented passwords.")
