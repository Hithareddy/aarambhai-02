from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.learning import LearningModule, Lesson
from typing import Dict, Any, List

class ValidationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def run_curriculum_audit(self) -> Dict[str, Any]:
        """
        Execute programmatic sweeps across Curriculum sequences and Content Blocks
        to verify URLs, text nodes, quiz boundaries, and accessibility (alt-text/TTS).
        """
        report = {
            "total_modules": 0,
            "total_lessons": 0,
            "orphaned_lessons": 0,
            "empty_modules": 0,
            "accessibility_warnings": [],
            "content_errors": [],
            "is_valid": True
        }

        # 1. Fetch modules
        result = await self.db.execute(select(LearningModule))
        modules = result.scalars().all()
        report["total_modules"] = len(modules)

        # 2. Fetch all lessons
        lesson_result = await self.db.execute(select(Lesson))
        all_lessons = lesson_result.scalars().all()
        report["total_lessons"] = len(all_lessons)

        # Build map for fast lookup
        module_ids = {str(m.id) for m in modules}
        lessons_by_module: Dict[str, List[Lesson]] = {str(m.id): [] for m in modules}

        # Check for orphans
        for lesson in all_lessons:
            mod_id = str(lesson.module_id)
            if mod_id not in module_ids:
                report["orphaned_lessons"] += 1
                report["content_errors"].append(f"Orphaned Lesson: '{lesson.title}' ({lesson.id}) missing Module {mod_id}")
                report["is_valid"] = False
            else:
                lessons_by_module[mod_id].append(lesson)

            # Deep inspect blocks
            block_issues = self._inspect_blocks(lesson)
            if block_issues["errors"]:
                report["content_errors"].extend(block_issues["errors"])
                report["is_valid"] = False
            if block_issues["warnings"]:
                report["accessibility_warnings"].extend(block_issues["warnings"])

        # Check for empty modules
        for mod_id, lessons in lessons_by_module.items():
            if not lessons:
                report["empty_modules"] += 1
                report["content_errors"].append(f"Empty Module: {mod_id} contains no lessons")
                report["is_valid"] = False

        return report

    def _inspect_blocks(self, lesson: Lesson) -> Dict[str, List[str]]:
        errors = []
        warnings = []
        
        if not lesson.content_blocks:
            errors.append(f"Lesson '{lesson.title}' ({lesson.id}) has empty content_blocks")
            return {"errors": errors, "warnings": warnings}

        for idx, block in enumerate(lesson.content_blocks):
            block_type = block.get("type")
            content = block.get("content", {})

            if not block_type:
                errors.append(f"Lesson '{lesson.title}' ({lesson.id}) Block {idx} missing 'type'")
                continue

            # Accessibility & Content Checks
            if block_type == "image":
                if "url" not in content:
                    errors.append(f"Lesson '{lesson.title}' Image Block {idx} missing url")
                if "alt" not in content or not content["alt"]:
                    warnings.append(f"Lesson '{lesson.title}' Image Block {idx} missing alt text")
            elif block_type == "audio":
                if "url" not in content:
                    errors.append(f"Lesson '{lesson.title}' Audio Block {idx} missing url")
                if "transcript" not in content or not content["transcript"]:
                    warnings.append(f"Lesson '{lesson.title}' Audio Block {idx} missing transcript")
            elif block_type == "quiz":
                if "question" not in content:
                    errors.append(f"Lesson '{lesson.title}' Quiz Block {idx} missing question")
                if "options" not in content or len(content["options"]) < 2:
                    errors.append(f"Lesson '{lesson.title}' Quiz Block {idx} must have >= 2 options")
                if "correctAnswer" not in content:
                    errors.append(f"Lesson '{lesson.title}' Quiz Block {idx} missing correctAnswer")

        return {"errors": errors, "warnings": warnings}
