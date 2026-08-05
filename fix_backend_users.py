"""
Fix all demo / seed accounts in backend/aarambh_local.db:
- Updates any user with a broken/placeholder hash to a known good password
- Creates testuser002@gmail.com and testuser201@gmail.com if missing
- Sets the known password for all accounts to TestPass@123
"""
import sqlite3
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
KNOWN_PASSWORD = "TestPass@123"
ADMIN_PASSWORD = "Admin@123"

DB_PATH = "backend/aarambh_local.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

now = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()

# Get all users
cur.execute("SELECT id, email, hashed_password, is_active FROM users")
users = cur.fetchall()

broken_prefixes = {"x", "hash", "hashed_pass_123", "hashed_password", "test_hash"}

fixed = 0
for uid, email, hp, is_active in users:
    # Detect broken hashes: too short or known placeholder strings
    is_broken = (not hp) or (hp.strip() in broken_prefixes) or (not hp.startswith("$2"))
    if is_broken:
        new_hash = pwd_context.hash(KNOWN_PASSWORD)
        cur.execute(
            "UPDATE users SET hashed_password=?, is_active=1, updated_at=? WHERE id=?",
            (new_hash, now, uid)
        )
        print(f"Fixed hash for: {email}")
        fixed += 1

# Upsert known demo accounts
demo_users = [
    ("testuser002@gmail.com", "Test User 002", KNOWN_PASSWORD, 0),
    ("testuser201@gmail.com", "Test User 201", KNOWN_PASSWORD, 0),
    ("admin@aarambh.ai", "Admin User", ADMIN_PASSWORD, 1),
]

for email, full_name, password, is_super in demo_users:
    cur.execute("SELECT id FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    hashed = pwd_context.hash(password)
    if row:
        cur.execute(
            "UPDATE users SET hashed_password=?, full_name=?, is_active=1, is_verified=1, updated_at=? WHERE email=?",
            (hashed, full_name, now, email)
        )
        print(f"Updated: {email}  password={password}")
    else:
        new_uid = str(uuid.uuid4())
        cur.execute(
            """INSERT INTO users (id, email, full_name, hashed_password, is_active, is_verified, is_superuser, created_at, updated_at)
               VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?)""",
            (new_uid, email, full_name, hashed, is_super, now, now)
        )
        print(f"Created: {email}  password={password}")

conn.commit()

# Verify
print(f"\n--- Verification ---")
cur.execute("SELECT email, hashed_password, is_active FROM users")
all_users = cur.fetchall()
for email, hp, active in all_users:
    try:
        ok = pwd_context.verify(KNOWN_PASSWORD, hp)
    except Exception:
        ok = False
    status = "OK" if ok else ("ADMIN_CHECK" if email == "admin@aarambh.ai" else "BROKEN")
    if email == "admin@aarambh.ai":
        try:
            ok_admin = pwd_context.verify(ADMIN_PASSWORD, hp)
            status = "OK" if ok_admin else "BROKEN"
        except Exception:
            status = "BROKEN"
    print(f"  {email}: active={active}, pw_verify={status}")

print(f"\nTotal users: {len(all_users)}, Fixed broken hashes: {fixed}")
conn.close()
