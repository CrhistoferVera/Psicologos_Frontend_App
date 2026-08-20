import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { apiGetMyProfileUser } from "../../../api/userProfile";
import { getInitials, normalizeRole } from "../utils/profile";

export function useUserProfile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          setLoading(true);
          const data = await apiGetMyProfileUser();
          setProfile(data);
        } catch {
          // silently keep AuthContext fallback data visible
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const displayName = useMemo(() => {
    const firstName = profile?.firstName ?? user?.firstName ?? "";
    const lastName = profile?.lastName ?? user?.lastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName.length > 0 ? fullName : "Usuario";
  }, [profile?.firstName, profile?.lastName, user?.firstName, user?.lastName]);

  return {
    logout,
    loading,
    displayName,
    email: profile?.email ?? user?.email ?? "Sin correo registrado",
    phone: profile?.phoneNumber ?? user?.phoneNumber ?? "Sin teléfono registrado",
    roleLabel: normalizeRole(profile?.role ?? user?.role),
    avatarUrl: profile?.userProfile?.avatarUrl ?? profile?.UserProfile?.avatarUrl,
    initials: getInitials(
      profile?.firstName ?? user?.firstName,
      profile?.lastName ?? user?.lastName,
    ),
    isProfileComplete: Boolean(profile?.isProfileComplete),
  };
}
