import os
import asyncio
import asyncpg
from dotenv import load_dotenv

load_dotenv('backend/.env')
db_url = os.environ.get('DATABASE_URL')
if db_url and db_url.startswith('postgresql+asyncpg'):
    db_url = db_url.replace('+asyncpg', '')

async def main():
    conn = await asyncpg.connect(db_url)
    
    rows = await conn.fetch("SELECT * FROM questions ORDER BY display_order ASC LIMIT 15;")
    
    print("\n--- FIRST 15 QUESTIONS IN DB ---")
    for i, r in enumerate(rows):
        d = dict(r)
        print(f"Q{i+1}: Skill={d.get('skill')} | Type={d.get('question_type')} | Difficulty={d.get('difficulty_level', d.get('difficulty', 'N/A'))}")
        print(f"Content: {d.get('target_text')} -- {d.get('specific_content', '')[:60]}")
        print("-" * 50)
        
    await conn.close()
    
if __name__ == "__main__":
    asyncio.run(main())
