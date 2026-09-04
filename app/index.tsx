import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { appTheme } from "../src/theme/appTheme";

export default function Home() {
  const { user, isHydrated, activeMode, capabilities } = useAuth();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: appTheme.colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  if (user) {
    const isAdmin = capabilities.isAdmin || user.role === "ADMIN";
    // Fallback al rol legacy para enrutar sin parpadeo mientras carga el modo.
    const canProfessional =
      capabilities.isProfessional || user.role === "PROFESSIONAL" || user.role === "ANFITRIONA";

    if (isAdmin) return <Redirect href="/(public)/admin-only" />;
    // Se enruta por el modo activo del toggle, no por el rol.
    if (activeMode === "PROFESSIONAL" && canProfessional) {
      return <Redirect href="/(professional)/dashboard" />;
    }
    return <Redirect href="/(user)/home" />;
  }

  return <Redirect href="/(public)/splash" />;
}
