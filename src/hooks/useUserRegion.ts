import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export type UserRegion = {
  isBolivian: boolean;
  currency: "BOB" | "USD";
  canDetermineRegion: boolean;
};

// SANAMENTE: por ahora el único método de pago es QR (Baneco). Se oculta Stripe
// tratando a todos como región Bolivia/BOB → la UI siempre ofrece QR. Cuando se
// implemente el nuevo modelo de negocio (pago por comprobante) este switch se
// reemplaza por la lógica real de región.
const QR_FOR_EVERYONE = true;

export function useUserRegion(): UserRegion {
  const { user } = useAuth();

  return useMemo(() => {
    if (QR_FOR_EVERYONE) {
      return { canDetermineRegion: true, isBolivian: true, currency: "BOB" };
    }

    const canDetermineRegion = Boolean((user?.country ?? "").trim());
    const isBolivian = user?.country === "BO";

    return {
      canDetermineRegion,
      isBolivian,
      currency: isBolivian ? "BOB" : "USD",
    };
  }, [user?.country]);
}
