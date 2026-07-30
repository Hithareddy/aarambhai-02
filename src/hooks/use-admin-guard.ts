/**
 * useAdminGuard - redirects any is_superuser account away from learner-only routes.
 *
 * Call at the TOP of any learner-only page component.
 * While the async check runs, `checking` is true.
 * Callers should return null while checking to avoid flashing learner content.
 *
 * Example:
 *   const { checking } = useAdminGuard();
 *   if (checking) return null;
 */
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { apiRequest } from "@/lib/api/http";

export function useAdminGuard(): { checking: boolean } {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setChecking(false);
      return;
    }

    apiRequest<{ is_superuser: boolean }>("/users/me")
      .then((user) => {
        if (user?.is_superuser) {
          navigate({ to: "/admin" as any, replace: true });
          // keep checking=true so page stays blank until navigation completes
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { checking };
}
