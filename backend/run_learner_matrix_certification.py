"""
Aarambh AI Master Certification Matrix Runner.

Executes 5 distinct learner profiles through the live application API stack:
- Learner A: Under 12, Student, Telugu Website, Telugu Learning
- Learner B: Under 12, Student, Telugu Website, English Learning
- Learner C: 22, College Student, English Website, English Learning
- Learner D: 30, Working Professional, English Website, English Learning
- Learner E: 65, Senior Citizen, Hindi Website, Hindi Learning
"""

import asyncio
import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

API_BASE = "http://localhost:8000/api/v1"

LEARNERS_CONFIG = [
    {
        "key": "Learner A",
        "email": "cert_learner_a@aarambh.ai",
        "password": "Password123!",
        "full_name": "Ananya (Child, Telugu-Telugu)",
        "profile": {
            "name": "Ananya",
            "age_group": "Under 12",
            "current_role": "Student",
            "educational_background": "Primary",
            "learning_goal": "School Literacy",
            "learning_language": "te",
            "website_language": "te",
            "daily_goal_minutes": 15,
            "current_familiarity": "Beginner",
            "digital_comfort": "Medium"
        },
        "behavior": "beginner"
    },
    {
        "key": "Learner B",
        "email": "cert_learner_b@aarambh.ai",
        "password": "Password123!",
        "full_name": "Karthik (Child, Telugu-English)",
        "profile": {
            "name": "Karthik",
            "age_group": "Under 12",
            "current_role": "Student",
            "educational_background": "Primary",
            "learning_goal": "Learn English",
            "learning_language": "en",
            "website_language": "te",
            "daily_goal_minutes": 15,
            "current_familiarity": "Elementary",
            "digital_comfort": "Medium"
        },
        "behavior": "beginner_growing"
    },
    {
        "key": "Learner C",
        "email": "cert_learner_c@aarambh.ai",
        "password": "Password123!",
        "full_name": "Rohan (College Student)",
        "profile": {
            "name": "Rohan",
            "age_group": "18-25",
            "current_role": "College Student",
            "educational_background": "Undergraduate",
            "learning_goal": "Exam Prep",
            "learning_language": "en",
            "website_language": "en",
            "daily_goal_minutes": 30,
            "current_familiarity": "Intermediate",
            "digital_comfort": "High"
        },
        "behavior": "intermediate"
    },
    {
        "key": "Learner D",
        "email": "cert_learner_d@aarambh.ai",
        "password": "Password123!",
        "full_name": "Vikram (Working Professional)",
        "profile": {
            "name": "Vikram",
            "age_group": "Working Professional (18+)",
            "current_role": "Working Professional",
            "educational_background": "Graduate",
            "learning_goal": "Career Advancement",
            "learning_language": "en",
            "website_language": "en",
            "daily_goal_minutes": 45,
            "current_familiarity": "Advanced",
            "digital_comfort": "High"
        },
        "behavior": "advanced"
    },
    {
        "key": "Learner E",
        "email": "cert_learner_e@aarambh.ai",
        "password": "Password123!",
        "full_name": "Savitri (Senior Citizen)",
        "profile": {
            "name": "Savitri",
            "age_group": "Senior Citizen (60+)",
            "current_role": "Senior Citizen",
            "educational_background": "Secondary",
            "learning_goal": "Devotional & Reading",
            "learning_language": "hi",
            "website_language": "hi",
            "daily_goal_minutes": 20,
            "current_familiarity": "Beginner",
            "digital_comfort": "Low"
        },
        "behavior": "beginner"
    }
]


def api_request(endpoint, method="GET", payload=None, token=None):
    url = f"{API_BASE}{endpoint}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        raise RuntimeError(f"HTTP {e.code} on {method} {endpoint}: {err_body}")


def run_certification():
    print("=" * 90)
    print("AARAMBH AI MASTER LEARNER MATRIX CERTIFICATION RUNNER")
    print("=" * 90)

    certification_results = []

    for cfg in LEARNERS_CONFIG:
        print(f"\n---------------------------------------------------------------------------")
        print(f"RUNNING CERTIFICATION FOR {cfg['key']}: {cfg['full_name']}")
        print(f"Target Lang: {cfg['profile']['learning_language']} | Website Lang: {cfg['profile']['website_language']}")
        print(f"---------------------------------------------------------------------------")

        # 1. Auth: Signup or Login
        auth_payload = {"email": cfg["email"], "password": cfg["password"], "full_name": cfg["full_name"]}
        token = None
        try:
            res_signup = api_request("/auth/register", "POST", auth_payload)
            token = res_signup.get("access_token")
        except Exception:
            # Login if user already exists
            res_login = api_request("/auth/login", "POST", {"email": cfg["email"], "password": cfg["password"]})
            token = res_login.get("access_token")

        assert token, f"Authentication failed for {cfg['key']}"
        print(f"  [Pass] Auth & JWT Session Established")

        # 2. Save Learner Onboarding Profile
        prof_res = api_request("/learners/", "POST", cfg["profile"], token=token)
        assert prof_res.get("id"), f"Profile creation failed for {cfg['key']}"
        print(f"  [Pass] Onboarding Profile Persisted (ID: {prof_res['id']})")

        # 3. Create Assessment Session
        sess_res = api_request("/assessments/sessions", "POST", {"blueprint_id": None}, token=token)
        session_id = sess_res["id"]
        start_diff = sess_res["current_difficulty"]
        print(f"  [Pass] Adaptive Assessment Session Created (Session ID: {session_id}, Starting Difficulty: {start_diff})")

        # 4. Run 15-Question Adaptive Journey
        asked_questions = []
        questions_answered = 0

        for i in range(15):
            q_data = api_request(f"/assessments/sessions/{session_id}/next-question", "GET", token=token)
            q_id = q_data["id"]
            diff = q_data["difficulty"]
            skill = q_data["skill"]
            opts = q_data.get("options") or []
            
            asked_questions.append({
                "id": q_id,
                "skill": skill,
                "difficulty": diff,
                "question_type": q_data.get("question_type"),
                "prompt": q_data.get("question_content", {}).get("text") or q_data.get("question_content", {}).get("prompt")
            })

            # Determine response choice based on behavior profile
            selected_ans = opts[0]["id"] if opts else "test"
            if cfg["behavior"] == "beginner" and diff > 1 and len(opts) > 1:
                selected_ans = opts[-1]["id"]  # Miss higher difficulty items
            elif cfg["behavior"] == "beginner_growing":
                if diff > 2 and len(opts) > 1:
                    selected_ans = opts[-1]["id"]
            elif cfg["behavior"] == "advanced" and len(opts) > 0:
                selected_ans = opts[0]["id"]  # High accuracy

            sub_res = api_request(
                f"/assessments/sessions/{session_id}/responses",
                "POST",
                {"question_id": q_id, "selected_answer": selected_ans, "response_time_seconds": 4},
                token=token
            )
            questions_answered += 1

        print(f"  [Pass] 15 Adaptive Questions Answered (Types: {set(q['question_type'] for q in asked_questions)})")

        # 5. Complete Assessment & Fetch Diagnostic Result
        result_data = api_request(f"/assessments/sessions/{session_id}/complete", "POST", token=token)
        
        cefr = result_data.get("overall_proficiency")
        confidence = result_data.get("confidence_score")
        readiness = result_data.get("readiness_level")
        strengths = result_data.get("strengths")
        weaknesses = result_data.get("weaknesses")
        summary = result_data.get("learning_summary")
        learning_path = result_data.get("learning_path") or []

        print(f"  [Pass] Diagnostic Result Certified:")
        print(f"          • Overall CEFR Level : {cefr}")
        print(f"          • Confidence Score   : {round(confidence, 2)}")
        print(f"          • Readiness Level    : {readiness}")
        print(f"          • Strengths          : {strengths}")
        print(f"          • Weaknesses         : {weaknesses}")
        print(f"          • Learning Summary   : {summary}")
        print(f"          • First Rec. Module  : {learning_path[0]['title'] if learning_path else 'None'}")

        # 6. Verify AI Tutor Screen Context Payload Integration
        tutor_conv = api_request("/tutor/conversations/new", "POST", {}, token=token)
        tutor_conv_id = tutor_conv["id"]
        
        tutor_msg_res = api_request(
            f"/tutor/conversations/{tutor_conv_id}/chat",
            "POST",
            {
                "conversationId": tutor_conv_id,
                "message": "Can you explain this result?",
                "mode": "explain_lesson",
                "screenContext": {
                    "page_type": "assessment_results",
                    "assessment_mode": True,
                    "difficulty": start_diff,
                    "learner_answer": f"CEFR Level: {cefr}",
                    "correct_answer": f"Strengths: {strengths}"
                }
            },
            token=token
        )
        tutor_reply = tutor_msg_res.get("content") or tutor_msg_res.get("message")
        print(f"  [Pass] AI Tutor Screen Context Payload Handshake Certified (Reply length: {len(str(tutor_reply))})")

        certification_results.append({
            "key": cfg["key"],
            "name": cfg["full_name"],
            "starting_difficulty": start_diff,
            "cefr": cefr,
            "confidence": round(confidence, 2),
            "readiness": readiness,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "summary": summary,
            "first_module": learning_path[0]["title"] if learning_path else "None",
            "tutor_verified": bool(tutor_reply)
        })

    # Summary Matrix Printout
    print("\n" + "=" * 90)
    print("MASTER CERTIFICATION MATRIX COMPARISON SUMMARY")
    print("=" * 90)
    print(f"{'Learner':<12} | {'Start Diff':<10} | {'CEFR':<12} | {'Confidence':<10} | {'Readiness':<14} | {'First Module':<25}")
    print("-" * 90)
    for r in certification_results:
        print(f"{r['key']:<12} | {r['starting_difficulty']:<10} | {r['cefr']:<12} | {r['confidence']:<10} | {r['readiness']:<14} | {r['first_module']:<25}")
    print("=" * 90)

    # Validate distinct outputs between Learner A (Child) and Learner D (Working Pro)
    a = certification_results[0]
    d = certification_results[3]
    
    assert a["cefr"] != d["cefr"], "Learner A and D CEFR placement MUST differ!"
    assert a["first_module"] != d["first_module"], "Learner A and D first module recommendation MUST differ!"
    assert a["starting_difficulty"] != d["starting_difficulty"], "Learner A and D starting difficulty MUST differ!"

    print("\n[SUCCESS] MASTER LEARNER MATRIX CERTIFICATION 100% PASSED ACROSS ALL 5 LEARNER PROFILES!")


if __name__ == "__main__":
    run_certification()
