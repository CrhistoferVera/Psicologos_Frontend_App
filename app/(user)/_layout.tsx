import { Redirect, Stack, usePathname } from "expo-router";
import { View } from "react-native";
import UserBottomNav from "../../src/features/user-home/components/UserBottomNav";
import { useAuth } from "../../src/context/AuthContext";
import { appTheme } from "../../src/theme/appTheme";

export default function UserLayout() {
  const pathname = usePathname();
  const hideNav = pathname.includes("/chats/") || pathname.includes("/professionals/");
  const { user, isHydrated } = useAuth();

  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: appTheme.colors.background }} />;
  }

  if (!user) {
    return <Redirect href="/(public)/auth" />;
  }

  if (user.role !== "USER") {
    const isProfessional = user.role === "PROFESSIONAL" || user.role === "ANFITRIONA";
    if (isProfessional) return <Redirect href="/(professional)/dashboard" />;
    if (user.role === "ADMIN") return <Redirect href="/(public)/admin-only" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {!hideNav ? <UserBottomNav /> : null}
    </View>
  );
}
