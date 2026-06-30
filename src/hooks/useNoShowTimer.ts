import { useEffect, useState } from "react";

export function useNoShowTimer(
  scheduledStartAt: string | null | undefined,
  graceMinutes: number,
  extensionDeadline?: number | null,
) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!scheduledStartAt) return;
    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [scheduledStartAt]);

  if (!scheduledStartAt) {
    return { canReport: false, minutesLeft: graceMinutes, secondsLeft: 0 };
  }

  const deadline = extensionDeadline
    ? extensionDeadline
    : new Date(scheduledStartAt).getTime() + graceMinutes * 60_000;

  const msLeft = Math.max(0, deadline - nowMs);
  const canReport = nowMs >= deadline;
  const minutesLeft = Math.floor(msLeft / 60_000);
  const secondsLeft = Math.floor((msLeft % 60_000) / 1000);

  return { canReport, minutesLeft, secondsLeft };
}
