import { Redirect, Stack, usePathname } from "expo-router";
import { View } from "react-native";
import UserBottomNav from "../../src/features/user-home/components/UserBottomNav";
import { useAuth } from "../../src/context/AuthContext";
import { appTheme } from "../../src/theme/appTheme";

export default function UserLayout() {
  const pathname = usePathname();
  const hideNav =
    pathname.includes("/chats/") ||
    pathname.includes("/professionals/") ||
    pathname.includes("/bookings/new") ||
    pathname.includes("/bookings/payment/");
  const { user, isHydrated, capabilities } = useAuth();

  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: appTheme.colors.background }} />;
  }

  if (!user) {
    return <Redirect href="/(public)/auth" />;
  }

  // El área de usuario/cliente es accesible para cualquier cuenta no-admin
  // (incluidos los profesionales que operan como cliente). Solo se expulsa al admin.
  if (capabilities.isAdmin || user.role === "ADMIN") {
    return <Redirect href="/(public)/admin-only" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {!hideNav ? <UserBottomNav /> : null}
    </View>
  );
}
