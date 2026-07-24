import asyncio
import sys
from uuid import UUID

from httpx import AsyncClient

async def test_todays_learning():
    # Attempting to login first
    async with AsyncClient(base_url="http://localhost:8001") as client:
        # Auth the test user
        print("Authenticating...")
        login_data = {"email": "learner@example.com", "password": "password123"}
        response = await client.post("/api/v1/auth/login", json=login_data)
        if response.status_code != 200:
            print("Failed to login", response.status_code, getattr(response, "text", ""))
            return
            
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print("Fetching Today's Learning...")
        learning_res = await client.get("/api/v1/practice/todays-learning", headers=headers)
        if learning_res.status_code == 200:
            data = learning_res.json()
            print("Successfully fetched Today's Learning!")
            print(f"Time: {data.get('estimated_time')}")
            print(f"XP: {data.get('total_xp')}")
            print(f"Module Context: {data.get('module_context')}")
            print(f"Activities Count: {len(data.get('activities', []))}")
            if len(data.get('activities', [])) > 0:
                print("First Activity:", data['activities'][0])
        else:
            print("Failed fetching Today's Learning:", learning_res.status_code, learning_res.text)

if __name__ == "__main__":
    asyncio.run(test_todays_learning())
