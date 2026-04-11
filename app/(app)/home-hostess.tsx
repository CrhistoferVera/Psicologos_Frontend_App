import { useEffect, useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import Screen from "../../src/components/Screen";
import { useAuth } from "../../src/context/AuthContext";
import { getProfile } from "../../src/services/auth";

export default function HomeHostess() {
  const { accessToken, user, isHydrated, setSession, logout } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const validate = async () => {
      if (!accessToken) {
        router.replace("/(auth)/choose-access");
        return;
      }
      try {
        const profile = await getProfile();
        if (profile.role !== "ANFITRIONA") {
          setError("Acceso solo para anfitrionas aprobadas.");
          await logout();
          router.replace("/(auth)/choose-access");
          return;
        }
        await setSession(accessToken, profile);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Sesión expirada.";
        setError(message);
        await logout();
        router.replace("/(auth)/choose-access");
      }
    };

    if (isHydrated) {
      void validate();
    }
  }, [accessToken, isHydrated, logout, setSession]);

  return (
    <Screen pad={false} className="items-center justify-center">
      <Text className="text-white text-2xl font-semibold">Home Anfitriona</Text>
      <Text className="text-white/60 mt-2">Llegaste OK</Text>
      <Text className="text-white/70 mt-4">
        {user?.firstName ? `Hola, ${user.firstName}` : "Hola"}
      </Text>
      <Text className="text-white/70 mt-1">
        {user?.email ? `Email: ${user.email}` : "Email: -"}
      </Text>
      {error ? (
        <Text className="text-red-400 text-sm mt-4 text-center">{error}</Text>
      ) : null}
    </Screen>
  );
}
