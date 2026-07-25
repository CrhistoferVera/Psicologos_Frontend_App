import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export type UserRegion = {
  isBolivian: boolean;
  currency: "BOB" | "USD";
  canDetermineRegion: boolean;
};

export function useUserRegion(): UserRegion {
  const { user } = useAuth();

  return useMemo(() => {
    const canDetermineRegion = Boolean((user?.country ?? "").trim());
    const isBolivian = user?.country === "BO";

    return {
      canDetermineRegion,
      isBolivian,
      currency: isBolivian ? "BOB" : "USD",
    };
  }, [user?.country]);
}
