import asyncio
import json
import re
import sys
from collections import Counter
from difflib import SequenceMatcher
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.question import Question

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

def calculate_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

async def run_quality_audit():
    print("Running Quality & Template Repetition Audit across 315 questions...")
    
    async with async_session_factory() as db:
        res = await db.execute(select(Question))
        questions = res.scalars().all()
        
        total_count = len(questions)
        exact_duplicates = 0
        near_duplicate_pairs = []
        prompts = []
        option_sets = []
        stems = []
        
        for q in questions:
            q_content = json.loads(q.question_content) if isinstance(q.question_content, str) else q.question_content
            prompt = (q_content.get("text") or q_content.get("prompt") or "").strip()
            prompts.append((str(q.id), prompt))
            
            # Extract prompt stem (first 4 words)
            words = prompt.split()
            stem = " ".join(words[:4]) if len(words) >= 4 else prompt
            stems.append(stem)
            
            # Option string serialization
            opts = json.loads(q.options) if isinstance(q.options, str) else q.options
            opt_str = json.dumps(opts, sort_keys=True)
            option_sets.append(opt_str)

        # 1. Exact Duplicate Count
        prompt_texts = [p[1] for p in prompts]
        prompt_counts = Counter(prompt_texts)
        exact_duplicates = sum(count - 1 for count in prompt_counts.values() if count > 1)
        
        # 2. Stem Repetition Analysis
        stem_counts = Counter(stems)
        top_stems = stem_counts.most_common(10)
        
        # 3. Near-Duplicate Cluster Detection (Similarity > 0.85)
        for i in range(len(prompts)):
            for j in range(i + 1, len(prompts)):
                id1, text1 = prompts[i]
                id2, text2 = prompts[j]
                if text1 == text2:
                    continue
                ratio = calculate_similarity(text1, text2)
                if ratio >= 0.85:
                    near_duplicate_pairs.append({
                        "id1": id1,
                        "text1": text1,
                        "id2": id2,
                        "text2": text2,
                        "similarity": round(ratio, 3)
                    })

        report = {
            "total_questions": total_count,
            "exact_duplicates": exact_duplicates,
            "near_duplicate_clusters_count": len(near_duplicate_pairs),
            "top_repeated_stems": [{"stem": s, "count": c} for s, c in top_stems],
            "unique_prompts_ratio": round(len(set(prompt_texts)) / float(total_count), 3),
            "unique_option_sets_ratio": round(len(set(option_sets)) / float(total_count), 3),
            "sample_near_duplicates": near_duplicate_pairs[:10]
        }

        print("\n=== QUALITY & TEMPLATE REPETITION REPORT ===")
        print(f"Total Questions: {report['total_questions']}")
        print(f"Exact Duplicate Prompts: {report['exact_duplicates']}")
        print(f"Near-Duplicate Clusters (>85% similarity): {report['near_duplicate_clusters_count']}")
        print(f"Unique Prompt Ratio: {report['unique_prompts_ratio'] * 100}%")
        print(f"Unique Option Sets Ratio: {report['unique_option_sets_ratio'] * 100}%")
        print("\nTop Repeated Stems:")
        for item in report["top_repeated_stems"]:
            print(f"  '{item['stem']}...': {item['count']} occurrences")

        with open("quality_repetition_audit.json", "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print("\nReport saved to quality_repetition_audit.json")

if __name__ == "__main__":
    asyncio.run(run_quality_audit())
