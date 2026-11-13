"use client";

import { useEffect, useState } from "react";

type HealthState = "checking" | "healthy" | "unavailable";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function HealthStatus() {
  const [state, setState] = useState<HealthState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    async function checkHealth() {
      try {
        const response = await fetch(
          `${apiUrl.replace(/\/$/, "")}/api/v1/health`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok || (await response.json()).status !== "ok") {
          throw new Error("API health check failed");
        }
        if (!controller.signal.aborted) setState("healthy");
      } catch {
        if (!controller.signal.aborted) setState("unavailable");
      }
    }

    void checkHealth();
    return () => controller.abort();
  }, []);

  if (state === "checking") {
    return <span aria-live="polite">Checking API...</span>;
  }

  return state === "healthy" ? (
    <span role="status" className="font-semibold text-emerald-800">
      API healthy
    </span>
  ) : (
    <span role="alert" className="font-semibold text-rose-800">
      API unavailable
    </span>
  );
}
