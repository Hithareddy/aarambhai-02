"""
Automated verification of all dashboard and activity API endpoints.
"""
import asyncio
import sys
from datetime import date

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def test_all_endpoints():
    print("=== Testing All Dashboard & Activity Endpoints on Running FastAPI Backend ===")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Test health
        r_health = await client.get("http://127.0.0.1:8000/health")
        print(f"Health check status: {r_health.status_code}, data: {r_health.json()}")
        assert r_health.status_code == 200

        # 2. Login or Register a test user to get real token
        login_payload = {
            "email": "dashboard_test_user@example.com",
            "password": "Password123!"
        }
        r_login = await client.post(f"{BASE_URL}/auth/login", json=login_payload)
        
        if r_login.status_code != 200:
            # Register if user doesn't exist
            reg_payload = {
                "email": "dashboard_test_user@example.com",
                "password": "Password123!",
                "full_name": "Dashboard Tester"
            }
            r_reg = await client.post(f"{BASE_URL}/auth/register", json=reg_payload)
            print(f"Registration status: {r_reg.status_code}")
            tokens = r_reg.json()
        else:
            tokens = r_login.json()

        access_token = tokens["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        print("Login successful! Acquired JWT access token.")

        # 3. Test /auth/me
        r_me = await client.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"GET /auth/me -> {r_me.status_code}")
        assert r_me.status_code == 200

        # 4. Test /learners/me/profile (or check 404 if no profile yet, but create if needed)
        r_prof = await client.get(f"{BASE_URL}/learners/me/profile", headers=headers)
        print(f"GET /learners/me/profile -> {r_prof.status_code}")

        # 5. Test /activity/today
        r_today = await client.get(f"{BASE_URL}/activity/today", headers=headers)
        print(f"GET /activity/today -> {r_today.status_code}, total_active_seconds={r_today.json().get('total_active_seconds')}")
        assert r_today.status_code == 200

        # 6. Test /activity/summary (today, week, month)
        for period in ["today", "week", "month"]:
            r_sum = await client.get(f"{BASE_URL}/activity/summary?period={period}", headers=headers)
            print(f"GET /activity/summary?period={period} -> {r_sum.status_code}")
            assert r_sum.status_code == 200

        # 7. Test /activity/month
        today_date = date.today()
        r_month = await client.get(f"{BASE_URL}/activity/month?year={today_date.year}&month={today_date.month}", headers=headers)
        print(f"GET /activity/month -> {r_month.status_code}, days={len(r_month.json().get('daily_records', []))}")
        assert r_month.status_code == 200

        # 8. Test /activity/streak
        r_streak = await client.get(f"{BASE_URL}/activity/streak", headers=headers)
        print(f"GET /activity/streak -> {r_streak.status_code}, current_streak={r_streak.json().get('current_streak')}")
        assert r_streak.status_code == 200

        # 9. Test /activity/goal (PUT)
        r_goal = await client.put(f"{BASE_URL}/activity/goal", json={"goal_minutes": 30}, headers=headers)
        print(f"PUT /activity/goal -> {r_goal.status_code}, updated_goal={r_goal.json().get('goal_minutes')}")
        assert r_goal.status_code == 200

        # 10. Test /activity/sync (POST)
        sync_payload = {
          "activity_date": str(today_date),
          "category": "lessons",
          "delta_seconds": 15
        }
        r_sync = await client.post(f"{BASE_URL}/activity/sync", json=sync_payload, headers=headers)
        print(f"POST /activity/sync -> {r_sync.status_code}, total_active_seconds={r_sync.json().get('total_active_seconds')}")
        assert r_sync.status_code == 200

    print("=== All Endpoints Verified Successfully! Backend is completely functional! ===")

if __name__ == "__main__":
    asyncio.run(test_all_endpoints())
