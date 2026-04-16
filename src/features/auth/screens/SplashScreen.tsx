import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";
import { useAuth } from "../../../context/AuthContext";

export default function SplashScreen() {
  const router = useRouter();
  const { isHydrated, user } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    const timer = setTimeout(() => {
      if (user) {
        if (user.role === "ADMIN") {
          router.replace("/admin");
        } else if (user.role === "ANFITRIONA" || user.role === "PROFESSIONAL") {
          router.replace("/(professional)/dashboard");
        } else {
          router.replace("/(user)/home");
        }
      } else {
        router.replace("/(public)/onboarding");
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [isHydrated, user, router]);

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>PSI</Text>
      </View>
      <Text style={styles.title}>Pachamama Salud</Text>
      <Text style={styles.subtitle}>Conecta con profesionales verificados</Text>
      <ActivityIndicator color={appTheme.colors.primary} size="small" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E8F1FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoText: {
    color: appTheme.colors.primary,
    fontSize: 28,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "800",
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 28,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    color: appTheme.colors.textMuted,
    fontSize: 15,
    fontFamily: appTheme.fonts.body,
  },
});

