import { View, ActivityIndicator, Platform } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { appTheme } from "../src/theme/appTheme";

export default function Home() {
  const { user, isHydrated } = useAuth();

  if (Platform.OS === "web") {
    return <Redirect href="/admin" />;
  }

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: appTheme.colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  if (user) {
    if (user.role === "ADMIN") return <Redirect href="/admin" />;
    if (user.role === "ANFITRIONA" || user.role === "PROFESSIONAL") return <Redirect href="/(professional)/dashboard" />;
    return <Redirect href="/(user)/home" />;
  }

  return <Redirect href="/(public)/splash" />;
}
