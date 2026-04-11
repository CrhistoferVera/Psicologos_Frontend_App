import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { apiGetMyProfileUser } from "../../../api/userProfile";
import { appTheme } from "../../../theme/appTheme";

export default function UserProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiGetMyProfileUser();
        setProfile(data);
      } catch {
        setProfile(null);
      }
    })();
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/(public)/auth");
  }

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>Mi perfil</Text>
        <Text style={styles.subtitle}>Gestiona tu cuenta y accesos principales.</Text>

        <AppCard>
          <Text style={styles.name}>{profile?.firstName ?? user?.firstName ?? "Usuario"} {profile?.lastName ?? user?.lastName ?? ""}</Text>
          <Text style={styles.info}>{profile?.email ?? user?.email ?? "Sin correo registrado"}</Text>
          <Text style={styles.info}>{profile?.phoneNumber ?? user?.phoneNumber ?? ""}</Text>
        </AppCard>

        <AppCard>
          <Text style={styles.section}>Accesos rápidos</Text>
          <AppButton title="Ir a créditos" variant="secondary" onPress={() => router.push("/(user)/credits" as any)} />
          <AppButton title="Ver referidos" variant="secondary" onPress={() => router.push("/(user)/referrals" as any)} />
          <AppButton
            title="Configuración (próximamente)"
            variant="secondary"
            onPress={() => Alert.alert("Pendiente", "Se habilitará en la siguiente iteración.")}
          />
        </AppCard>

        <AppButton title="Cerrar sesión" variant="ghost" onPress={handleLogout} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 28,
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  name: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  info: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  section: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 16,
  },
});

