import { useEffect, useMemo, useState } from "react";
import { getRemainingSessionMs } from "../utils/sessionTime";

export function useSessionRemaining(sessionEndsAt: string | null | undefined, tickMs: number) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setNowMs(Date.now());

    if (!sessionEndsAt) return;
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, tickMs);

    return () => clearInterval(timer);
  }, [sessionEndsAt, tickMs]);

  const remainingMs = useMemo(
    () => getRemainingSessionMs(sessionEndsAt, nowMs),
    [sessionEndsAt, nowMs],
  );

  return {
    remainingMs,
    isExpired: remainingMs <= 0,
  };
}

