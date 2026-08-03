import json

def generate_review_md():
    with open("curated_assessment_catalogue_v5.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        items = data["items"]

    lines = []
    lines.append("# AARAMBH AI — CURATED ASSESSMENT QUESTION BANK REVIEW")
    lines.append("## Complete Offline Certified Catalogue (120 Items)")
    lines.append("")
    lines.append("This artifact provides full human-reviewable visibility into every authored question in the certified Part 5B assessment bank.")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Group by Skill -> Difficulty
    skills = ["listening", "speaking", "reading", "writing", "conversations"]
    
    for skill in skills:
        lines.append(f"## DOMAIN: {skill.upper()}")
        lines.append("")
        skill_items = [q for q in items if q["skill"] == skill]
        
        for diff in range(1, 6):
            diff_items = [q for q in skill_items if q["difficulty"] == diff]
            if not diff_items:
                continue
                
            lines.append(f"### Difficulty Level {diff}")
            lines.append("")
            
            for q in diff_items:
                lines.append(f"#### Question ID: `{q['id']}` ({q['core_or_personalized'].upper()})")
                lines.append(f"- **Scenario Family**: `{q['scenario_family']}`")
                lines.append(f"- **Question Type**: `{q['question_type']}` | **Subskill**: `{q['subskill']}`")
                lines.append(f"- **Learner-Visible Instruction**: *\"{q['visible_instruction']}\"*")
                
                if q['stimulus']:
                    lines.append(f"- **Learner-Visible Stimulus**: `{q['stimulus']}`")
                if q['hidden_audio_script']:
                    lines.append(f"- **HIDDEN Audio Script**: `\"{q['hidden_audio_script']}\"`")
                if q['speaking_reference']:
                    lines.append(f"- **Speaking Reference**: `\"{q['speaking_reference']}\"`")
                if q['image_url']:
                    lines.append(f"- **Visual Asset Path**: `{q['image_url']}`")
                    
                if q['options']:
                    lines.append("- **Options**:")
                    for opt in q['options']:
                        is_corr = False
                        if isinstance(q['correct_answer'], str) and opt['id'] == q['correct_answer']:
                            is_corr = True
                        elif isinstance(q['correct_answer'], list) and opt['text'] in q['correct_answer']:
                            is_corr = True
                        mark = "✓ [CORRECT]" if is_corr else ""
                        lines.append(f"  - **{opt['id']}**: {opt['text']} {mark}")
                elif q['correct_answer']:
                    lines.append(f"- **Correct Sentence Order**: `{' '.join(q['correct_answer'])}`")
                    
                if q.get('expected_keywords'):
                    lines.append(f"- **Expected Speech Keywords**: `{', '.join(q['expected_keywords'])}`")
                    
                lines.append(f"- **Educational Explanation**: {q['explanation']}")
                lines.append("")
                lines.append("---")
                lines.append("")

    with open("curated_assessment_review.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
        
    print("Successfully generated human-readable review catalogue: curated_assessment_review.md")

if __name__ == "__main__":
    generate_review_md()
