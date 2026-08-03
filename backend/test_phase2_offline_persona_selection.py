import json
import random
from collections import Counter

# Load master JSON questions directly
with open("data/aarambh_assessment_master_v1.json", "r", encoding="utf-8") as f:
    master_data = json.load(f)
    questions = master_data["questions"]

PERSONAS = [
    {
        "name": "1. 10-year-old Beginner Student",
        "age_group": "under_12",
        "current_role": "student",
        "educational_background": "primary",
        "learning_goal": "education",
        "current_familiarity": "beginner",
    },
    {
        "name": "2. 16-year-old Intermediate Student",
        "age_group": "12_17",
        "current_role": "student",
        "educational_background": "secondary",
        "learning_goal": "education",
        "current_familiarity": "intermediate",
    },
    {
        "name": "3. 20-year-old College Student",
        "age_group": "18_24",
        "current_role": "college_student",
        "educational_background": "college",
        "learning_goal": "workplace",
        "current_familiarity": "intermediate",
    },
    {
        "name": "4. 30-year-old Homemaker",
        "age_group": "25_45",
        "current_role": "homemaker",
        "educational_background": "general",
        "learning_goal": "confidence",
        "current_familiarity": "beginner",
    },
    {
        "name": "5. 35-year-old Working Professional",
        "age_group": "25_45",
        "current_role": "working_professional",
        "educational_background": "graduate",
        "learning_goal": "workplace",
        "current_familiarity": "intermediate",
    },
    {
        "name": "6. 68-year-old Senior Citizen",
        "age_group": "60_plus",
        "current_role": "senior_citizen",
        "educational_background": "general",
        "learning_goal": "everyday_communication",
        "current_familiarity": "beginner",
    }
]

def is_eligible(q, p):
    role = p["current_role"]
    age = p["age_group"]
    edu = p["educational_background"]
    goal = p["learning_goal"]
    ctx = q.get("context", "everyday")

    is_student = "student" in role or "under_12" in age or "12_17" in age or "primary" in edu or "secondary" in edu
    is_professional = "professional" in role
    is_senior = "senior" in role or "60_plus" in age
    is_homemaker = "homemaker" in role

    if is_student and ctx == "workplace":
        return False
    if is_professional and ctx == "school" and "child" not in goal:
        return False
    if is_senior and (ctx == "workplace" or ctx == "school"):
        return False
    if is_homemaker and ctx == "workplace":
        return False

    eligible_roles = q.get("eligible_roles", [])
    if eligible_roles:
        mapped_role = "student" if is_student else "working_professional" if is_professional else "senior_citizen" if is_senior else "homemaker" if is_homemaker else "general"
        if mapped_role not in eligible_roles and "general" not in eligible_roles:
            return False

    return True

def run_offline_simulations():
    print("Executing Phase 2 Offline Selection Engine Test...")
    TARGET_SKILLS = ["listening", "speaking", "reading", "writing", "everyday_communication"]
    
    all_passed = True
    results = []

    for p in PERSONAS:
        # Initial difficulty
        fam = p["current_familiarity"]
        curr_diff = 4 if "advanced" in fam else 3 if "intermediate" in fam else 2 if "elementary" in fam else 1

        used_ids = set()
        used_prompts = set()
        used_contexts = []
        used_types = []
        skill_counts = {s: 0 for s in TARGET_SKILLS}
        selected_qs = []

        for step in range(15):
            # Determine eligible skills (< 3 count)
            elig_skills = [s for s in TARGET_SKILLS if skill_counts[s] < 3]
            if not elig_skills:
                elig_skills = TARGET_SKILLS
            
            min_count = min(skill_counts[s] for s in elig_skills)
            pref_skills = [s for s in elig_skills if skill_counts[s] == min_count]

            cands = [q for q in questions if q["id"] not in used_ids and is_eligible(q, p)]
            if not cands:
                cands = [q for q in questions if q["id"] not in used_ids]

            s_cands = [q for q in cands if q["skill"] in pref_skills]
            if not s_cands:
                s_cands = [q for q in cands if q["skill"] in elig_skills]
            if not s_cands:
                s_cands = cands

            best_q = None
            best_score = -999999

            for q in s_cands:
                prompt_text = q.get("prompt") or q.get("instruction") or ""
                if prompt_text in used_prompts:
                    continue

                score = 0.0
                score -= abs(q["difficulty"] - curr_diff) * 100
                score -= used_contexts.count(q.get("context", "")) * 50
                score -= used_types.count(q.get("question_type", "")) * 30
                score += random.random() * 5

                if score > best_score:
                    best_score = score
                    best_q = q

            if best_q is None:
                best_q = s_cands[0]

            qid = best_q["id"]
            selected_qs.append(best_q)
            used_ids.add(qid)
            used_prompts.add(best_q.get("prompt") or best_q.get("instruction") or "")
            used_contexts.append(best_q.get("context", ""))
            used_types.append(best_q.get("question_type", ""))
            skill_counts[best_q["skill"]] += 1

            # Advance difficulty adaptively
            curr_diff = min(5, curr_diff + 1)

        qids = [q["id"] for q in selected_qs]
        is_15 = len(qids) == 15
        is_33333 = all(skill_counts[s] == 3 for s in TARGET_SKILLS)
        no_dups = len(set(qids)) == 15
        ctx_div = max(Counter(used_contexts).values()) <= 4

        passed = is_15 and is_33333 and no_dups and ctx_div
        if not passed:
            all_passed = False

        print(f"\nPersona: {p['name']}")
        print(f"  - Selected IDs: {qids}")
        print(f"  - Skill Counts: {skill_counts} (3-3-3-3-3: {'PASS' if is_33333 else 'FAIL'})")
        print(f"  - Context Distribution: {dict(Counter(used_contexts))}")
        print(f"  - Result: {'[SELECTION PASS]' if passed else '[FAIL]'}")

        results.append({"persona": p["name"], "passed": passed, "ids": qids})

    print(f"\n==================================================")
    print(f"OFFLINE SELECTION TEST RESULT: {'100% PASS' if all_passed else 'FAIL'}")
    print(f"==================================================")

if __name__ == "__main__":
    run_offline_simulations()
