import { Redirect, Stack } from "expo-router";
import { Platform, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { appTheme } from "../../src/theme/appTheme";

export default function PublicLayout() {
  const { user, isHydrated } = useAuth();

  if (Platform.OS !== "web") {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: appTheme.colors.background }} />;
  }

  if (user?.role === "ADMIN") {
    return <Redirect href="/admin" />;
  }

  return <Redirect href="/admin-login" />;
}
