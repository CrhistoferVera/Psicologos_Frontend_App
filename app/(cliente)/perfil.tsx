import { Alert, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import ProfileSummary from "@/src/components/cliente/perfil/ProfileSummary";
import ProfileMenuSection from "@/src/components/cliente/perfil/ProfileMenuSection";
import LogoutButton from "@/src/components/cliente/perfil/LogoutButton";
import { useAuth } from "@/src/context/AuthContext";
import { useEffect, useState } from "react";
import { Linking, AppState } from "react-native";
import notifee from "@notifee/react-native";

export default function ClientePerfil() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      const settings = await notifee.getNotificationSettings();
      setNotificationsEnabled(settings.authorizationStatus >= 1);
    };

    // Verificar al montar
    checkPermissions();

    // Verificar cada vez que el usuario vuelve a la app desde ajustes
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPermissions();
    });

    return () => sub.remove();
  }, []);

  const handleNotificationsPress = () => {
    Alert.alert(
      'Notificaciones',
      notificationsEnabled
        ? '¿Quieres desactivar las notificaciones?'
        : 'Las notificaciones están desactivadas. ¿Quieres activarlas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ir a Ajustes',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/choose-access");
          },
        },
      ],
    );
  };

  const mainItems = [
    {
      label: "Mis datos",
      onPress: () => router.push("/(cliente)/mis-datos" as any),
    },
    {
      label: "Billetera",
      onPress: () => router.push("/(cliente)/credito" as any),
    },
    {
      label: "Historial",
      onPress: () => router.push("/(cliente)/historial" as any),
    },
    {
      label: "Mis suscripciones",
      onPress: () => router.push("/(cliente)/mis-suscripciones" as any),
    },
    {
      label: notificationsEnabled === null
        ? "Notificaciones"
        : notificationsEnabled
          ? "Notificaciones ✅"
          : "Notificaciones ❌",
      onPress: handleNotificationsPress,
    },
  ];

  const secondaryItems = [
    {
      label: "Ayuda",
      onPress: () => router.push("/(cliente)/ayuda" as any),
    },
    {
      label: "Terminos y condiciones",
      onPress: () => router.push("/(cliente)/terminos" as any),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0000" }}>
      <ScreenHeader title="Perfil" role="cliente" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: insets.bottom + 24,
          gap: 14,
        }}
      >
        {/* Resumen del usuario */}
        {user && <ProfileSummary user={user} />}

        {/* Sección principal: Mis datos, Billetera, Historial */}
        <ProfileMenuSection items={mainItems} />

        {/* Sección secundaria: Ayuda, Términos */}
        <ProfileMenuSection items={secondaryItems} />

        <View style={{ marginTop: 8 }}>
          <LogoutButton onPress={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
}
