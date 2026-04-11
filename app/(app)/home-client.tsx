import { useEffect, useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import Screen from "../../src/components/Screen";
import { useAuth } from "../../src/context/AuthContext";
import { getProfile } from "../../src/services/auth";

export default function HomeClient() {
  const { accessToken, user, isHydrated, setSession, logout } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const validate = async () => {
      if (!accessToken) return;
      try {
        const profile = await getProfile();
        await setSession(accessToken, profile);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Sesi\u00f3n expirada.";
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
      <Text className="text-white text-2xl font-semibold">Home Cliente</Text>
      <Text className="text-white/60 mt-2">Sesion activa</Text>
      <Text className="text-white/70 mt-4">
        {user?.firstName ? `Hola, ${user.firstName}` : "Hola"}
      </Text>
      <Text className="text-white/70 mt-1">
        {user?.phoneNumber ? `Tel: ${user.phoneNumber}` : "Tel: -"}
      </Text>
      {error ? (
        <Text className="text-red-400 text-sm mt-4 text-center">{error}</Text>
      ) : null}
    </Screen>
  );
}
