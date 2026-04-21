import { useEffect, useRef, useState } from "react";

/**
 * Formatea segundos a mm:ss o hh:mm:ss si supera 1 hora.
 * Exported standalone para usarla donde no se necesite el hook reactivo.
 */
export function formatCallDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${String(h).padStart(2, "0")}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

/**
 * Calcula el tiempo transcurrido desde `startedAt` (timestamp ms) y lo
 * formatea como "mm:ss" o "hh:mm:ss". Devuelve "00:00" mientras `startedAt`
 * sea null (llamada aún no conectada o no iniciada).
 *
 * El valor se deriva de Date.now() - startedAt en cada tick, no de un contador
 * acumulativo, por lo que es inmune a re-renders y pausas de fondo.
 */
export function useCallDuration(startedAt: number | null): string {
  const [label, setLabel] = useState<string>("00:00");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (startedAt === null) {
      setLabel("00:00");
      return;
    }

    const tick = () => setLabel(formatCallDuration(Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startedAt]);

  return label;
}
