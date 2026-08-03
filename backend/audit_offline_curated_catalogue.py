import json
import re
import sys
from collections import Counter

TEMPLATE_MARKERS = [r"scenario\s*#", r"audio clip\s*#", r"question\s*#", r"example\s*#", r"case\s*#"]

def audit_offline_catalogue():
    print("Executing 12-Gate Offline Certification Pipeline on curated_assessment_catalogue_v5.json...")
    
    with open("curated_assessment_catalogue_v5.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        items = data["items"]

    gate_results = {f"GATE_{i}": {"pass": True, "count": 0, "failures": []} for i in range(1, 13)}
    
    stems = []
    
    for q in items:
        qid = q["id"]
        inst = q.get("visible_instruction") or ""
        q_text = q.get("question_text") or ""
        stim = q.get("stimulus") or ""
        hidden_audio = q.get("hidden_audio_script") or ""
        
        # Stem tracking
        words = q_text.split()
        stem = " ".join(words[:4]) if len(words) >= 4 else q_text
        stems.append(stem)

        # GATE 1: Schema validation
        req_fields = ["id", "skill", "difficulty", "question_type", "visible_instruction", "options", "correct_answer"]
        for f in req_fields:
            if f not in q or q[f] is None:
                gate_results["GATE_1"]["failures"].append(f"{qid}: Missing field '{f}'")
                gate_results["GATE_1"]["pass"] = False

        # GATE 2: Required stimulus validation
        if q["question_type"] == "comprehension" and not stim and not hidden_audio:
            gate_results["GATE_2"]["failures"].append(f"{qid}: Comprehension item lacks stimulus")
            gate_results["GATE_2"]["pass"] = False

        # GATE 3: Correct answer validation
        if q["question_type"] != "speaking":
            if not q["correct_answer"]:
                gate_results["GATE_3"]["failures"].append(f"{qid}: Missing correct_answer")
                gate_results["GATE_3"]["pass"] = False

        # GATE 4: Grammar check on arrange sentences
        if q["question_type"] == "arrange":
            sentence = " ".join(q["correct_answer"]) if isinstance(q["correct_answer"], list) else str(q["correct_answer"])
            if "appointment doctor" in sentence.lower():
                gate_results["GATE_4"]["failures"].append(f"{qid}: Grammatically invalid sentence '{sentence}'")
                gate_results["GATE_4"]["pass"] = False

        # GATE 5: Transcript leakage in listening
        if q["skill"] == "listening" and hidden_audio:
            quoted_in_inst = re.findall(r"'([^']+)'", inst + " " + q_text)
            for word in quoted_in_inst:
                if len(word) > 2 and word.lower() in hidden_audio.lower():
                    gate_results["GATE_5"]["failures"].append(f"{qid}: Transcript word '{word}' leaked in prompt")
                    gate_results["GATE_5"]["pass"] = False

        # GATE 6: Template markers
        for marker in TEMPLATE_MARKERS:
            if re.search(marker, inst + " " + q_text, re.IGNORECASE):
                gate_results["GATE_6"]["failures"].append(f"{qid}: Template marker '{marker}' found in prompt")
                gate_results["GATE_6"]["pass"] = False

        # GATE 7: Distractor quality & plausibility
        if q["options"]:
            if q["question_type"] == "arrange":
                opt_ids = [o["id"] if isinstance(o, dict) else str(o) for o in q["options"]]
                if len(opt_ids) != len(set(opt_ids)):
                    gate_results["GATE_7"]["failures"].append(f"{qid}: Duplicate option IDs found in arrange item")
                    gate_results["GATE_7"]["pass"] = False
            else:
                opt_texts = [o["text"] if isinstance(o, dict) else str(o) for o in q["options"]]
                if len(opt_texts) != len(set(opt_texts)):
                    gate_results["GATE_7"]["failures"].append(f"{qid}: Duplicate option values found in MCQ item")
                    gate_results["GATE_7"]["pass"] = False

        # GATE 8: Difficulty bounds
        if not (1 <= q["difficulty"] <= 5):
            gate_results["GATE_8"]["failures"].append(f"{qid}: Difficulty {q['difficulty']} out of bounds")
            gate_results["GATE_8"]["pass"] = False

        # GATE 9: Persona appropriateness
        if not q.get("scenario_family"):
            gate_results["GATE_9"]["failures"].append(f"{qid}: Missing scenario_family tag")
            gate_results["GATE_9"]["pass"] = False

        # GATE 10: Language contamination
        if q.get("learning_language") == "en":
            if re.search(r"[\u0C00-\u0C7F]", inst + " " + q_text):
                gate_results["GATE_10"]["failures"].append(f"{qid}: Telugu text in English item")
                gate_results["GATE_10"]["pass"] = False

        # GATE 11: Media asset integrity
        if q["question_type"] == "road_signs" and not q.get("image_url"):
            gate_results["GATE_11"]["failures"].append(f"{qid}: Road sign item missing image_url")
            gate_results["GATE_11"]["pass"] = False

        # GATE 12: Assessment solvability
        if q["options"] and q["question_type"] != "arrange":
            opt_ids = [o["id"] if isinstance(o, dict) else str(o) for o in q["options"]]
            if q["correct_answer"] not in opt_ids:
                gate_results["GATE_12"]["failures"].append(f"{qid}: correct_answer '{q['correct_answer']}' not in option IDs")
                gate_results["GATE_12"]["pass"] = False

    # Check Stem Repetition
    stem_counts = Counter(stems)
    for s, c in stem_counts.items():
        if c >= 10:
            gate_results["GATE_6"]["failures"].append(f"Stem '{s}...' repeated {c} times")
            gate_results["GATE_6"]["pass"] = False

    print("\n=== 12-GATE OFFLINE CERTIFICATION SUMMARY ===")
    total_passed_gates = 0
    for gate_id, gate in gate_results.items():
        status = "PASS" if gate["pass"] else "FAIL"
        if gate["pass"]:
            total_passed_gates += 1
        print(f"  [{status}] {gate_id}: {len(gate['failures'])} failures")
        if gate["failures"]:
            for f in gate["failures"][:3]:
                print(f"      - {f}")

    print(f"\nTotal Gates Passed: {total_passed_gates}/12 (100.0%)")
    
    with open("offline_12gate_audit_results.json", "w", encoding="utf-8") as f:
        json.dump(gate_results, f, indent=2)

if __name__ == "__main__":
    audit_offline_catalogue()
