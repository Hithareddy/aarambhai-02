import sqlite3
db = 'aarambh_local.db'
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print('Tables:', cur.fetchall())
cur.execute("SELECT count(*) FROM users")
print('User count:', cur.fetchone())
cur.execute("SELECT id, email, hashed_password, is_active FROM users LIMIT 10")
for r in cur.fetchall():
    hp = r[2][:30] if r[2] else 'NULL'
    print(' ', r[0][:8], '|', r[1], '| hash='+hp, '| active='+str(r[3]))
conn.close()
