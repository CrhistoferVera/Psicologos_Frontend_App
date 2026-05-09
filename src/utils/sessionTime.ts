export function getRemainingSessionMs(sessionEndsAt: string | null | undefined, nowMs = Date.now()): number {
  if (!sessionEndsAt) return 0;
  const endMs = new Date(sessionEndsAt).getTime();
  if (Number.isNaN(endMs)) return 0;
  return Math.max(0, endMs - nowMs);
}

export function formatRemainingMinText(remainingMs: number): string {
  if (remainingMs <= 0) return "0 min";
  const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  return `${minutes} min`;
}

export function formatRemainingClock(remainingMs: number): string {
  if (remainingMs <= 0) return "00:00";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

