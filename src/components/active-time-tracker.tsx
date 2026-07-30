/**
 * Active Time Tracker component.
 *
 * Single-instance component mounted in `_app.tsx` for tracking authenticated learner
 * active learning time.
 *
 * Features:
 * - Detects meaningful interactions (clicks, keypresses, touch, scroll, navigation).
 * - Throttles `mousemove` (max once every 30s) so cursor movement alone doesn't artificially prolong session.
 * - 3-minute (180s) idle threshold: pauses counting when idle, resumes on active interaction.
 * - Uses `document.visibilityState === "hidden"` as primary signal to pause tracking in background.
 * - Dynamically classifies categories (`lessons`, `assessment`, `games`, `ai_tutor`, `general`) from route path.
 * - Accumulates time locally; periodically syncs to FastAPI backend every 30 seconds.
 * - Retains pending seconds if network sync fails so no time is lost.
 */

import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/api/auth";
import { getApiClient } from "@/lib/api/client";

type Category = "lessons" | "assessment" | "games" | "ai_tutor" | "general";

function getCategoryFromPath(pathname: string): Category {
  const path = pathname.toLowerCase();
  if (path.includes("assessment") || path.startsWith("/assessments")) {
    return "assessment";
  }
  if (path.includes("lesson") || path.startsWith("/learn") || path.startsWith("/learning-path")) {
    return "lessons";
  }
  if (path.startsWith("/games")) {
    return "games";
  }
  if (path.startsWith("/ai-tutor")) {
    return "ai_tutor";
  }
  return "general";
}

function getLocalFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ActiveTimeTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Refs for tracking state without causing React re-renders
  const lastActivityTimeRef = useRef<number>(Date.now());
  const lastMouseMoveTimeRef = useRef<number>(0);
  const isIdleRef = useRef<boolean>(false);
  const currentCategoryRef = useRef<Category>("general");
  const isSyncingRef = useRef<boolean>(false);

  // Accumulated unsynced active seconds per category
  const pendingSecondsRef = useRef<Record<Category, number>>({
    assessment: 0,
    lessons: 0,
    games: 0,
    ai_tutor: 0,
    general: 0,
  });

  // Keep category updated based on router path
  useEffect(() => {
    currentCategoryRef.current = getCategoryFromPath(pathname);
  }, [pathname]);

  // Sync accumulated active time to backend
  const syncPendingTime = async () => {
    if (!isAuthenticated() || isSyncingRef.current) return;

    const pending = pendingSecondsRef.current;
    const totalPending =
      pending.assessment + pending.lessons + pending.games + pending.ai_tutor + pending.general;

    if (totalPending <= 0) return;

    // Snapshot snapshot payload to send
    const snapshotPayload = {
      activity_date: getLocalFormattedDate(),
      assessment_seconds: pending.assessment,
      lesson_seconds: pending.lessons,
      game_seconds: pending.games,
      ai_tutor_seconds: pending.ai_tutor,
      general_seconds: pending.general,
    };

    isSyncingRef.current = true;

    try {
      await getApiClient().syncActivity(snapshotPayload);

      // On successful sync, deduct sent seconds from pending buffer
      pendingSecondsRef.current.assessment -= snapshotPayload.assessment_seconds;
      pendingSecondsRef.current.lessons -= snapshotPayload.lesson_seconds;
      pendingSecondsRef.current.games -= snapshotPayload.game_seconds;
      pendingSecondsRef.current.ai_tutor -= snapshotPayload.ai_tutor_seconds;
      pendingSecondsRef.current.general -= snapshotPayload.general_seconds;
    } catch (err) {
      // Failed syncs are retained in pendingSecondsRef and retried on next tick
      console.warn("Active time sync failed; retaining pending seconds for retry:", err);
    } finally {
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) return;

    const IDLE_TIMEOUT_MS = 180_000; // 3 minutes of inactivity
    const MOUSE_MOVE_THROTTLE_MS = 30_000; // 30 seconds throttle for mousemove

    // Reset idle status when meaningful interaction occurs
    const registerInteraction = (isMouseMove = false) => {
      const now = Date.now();

      if (isMouseMove) {
        // Throttle mousemove so continuous mouse drift alone doesn't keep app active forever
        if (now - lastMouseMoveTimeRef.current < MOUSE_MOVE_THROTTLE_MS) {
          return;
        }
        lastMouseMoveTimeRef.current = now;
      }

      lastActivityTimeRef.current = now;
      if (isIdleRef.current) {
        isIdleRef.current = false;
      }
    };

    const handlePointerDown = () => registerInteraction(false);
    const handleClick = () => registerInteraction(false);
    const handleKeyDown = () => registerInteraction(false);
    const handleScroll = () => registerInteraction(false);
    const handleTouchStart = () => registerInteraction(false);
    const handleMouseMove = () => registerInteraction(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Pause tracking & trigger immediate background sync
        syncPendingTime();
      } else if (document.visibilityState === "visible") {
        // Resume interaction clock
        registerInteraction(false);
      }
    };

    // Attach interaction listeners to window
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });
    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 1-second ticker for accumulating active time
    const tickInterval = setInterval(() => {
      if (!isAuthenticated()) return;

      const now = Date.now();

      // Check if user has exceeded 3-minute idle threshold
      if (now - lastActivityTimeRef.current > IDLE_TIMEOUT_MS) {
        isIdleRef.current = true;
      }

      // Increment active seconds only if tab is visible and learner is not idle
      if (!isIdleRef.current && document.visibilityState === "visible") {
        const cat = currentCategoryRef.current;
        pendingSecondsRef.current[cat] = (pendingSecondsRef.current[cat] || 0) + 1;
      }
    }, 1000);

    // 30-second periodic sync interval
    const syncInterval = setInterval(() => {
      syncPendingTime();
    }, 30_000);

    // Sync on page unload / leave
    const handleBeforeUnload = () => {
      syncPendingTime();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      clearInterval(tickInterval);
      clearInterval(syncInterval);

      // Final sync attempt on unmount
      syncPendingTime();
    };
  }, []);

  return null; // Headless component
}
