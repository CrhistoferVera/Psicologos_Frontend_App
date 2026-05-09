import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export type UserRegion = {
  isBolivian: boolean;
  currency: "BOB" | "USD";
};

export function useUserRegion(): UserRegion {
  const { user } = useAuth();

  return useMemo(() => {
    const dialCode = (user?.phoneDialCode ?? "").replace(/\D/g, "");
    const isBolivian = dialCode === "591";

    return {
      isBolivian,
      currency: isBolivian ? "BOB" : "USD",
    };
  }, [user?.phoneDialCode]);
}
