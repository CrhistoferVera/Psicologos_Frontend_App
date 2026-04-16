import { Redirect, Stack, usePathname } from "expo-router";
import { View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { appTheme } from "../../src/theme/appTheme";
import ProfessionalBottomNav from "../../src/features/professional/components/ProfessionalBottomNav";

export default function ProfessionalLayout() {
  const { user, isHydrated } = useAuth();
  const pathname = usePathname();

  if (!isHydrated) return <View style={{ flex: 1, backgroundColor: appTheme.colors.background }} />;

  if (!user) return <Redirect href="/(public)/auth" />;

  if (user.role === "ADMIN") return <Redirect href="/admin" />;

  const isProfessional = user.role === "PROFESSIONAL" || user.role === "ANFITRIONA";
  if (!isProfessional) return <Redirect href="/(user)/home" />;

  const hideNav = pathname.includes("/messages/");

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {!hideNav ? <ProfessionalBottomNav /> : null}
    </View>
  );
}
