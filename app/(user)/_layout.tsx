import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import UserBottomNav from "../../src/features/user-home/components/UserBottomNav";

export default function UserLayout() {
  const pathname = usePathname();
  const hideNav = pathname.includes("/chats/") || pathname.includes("/professionals/");

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {!hideNav ? <UserBottomNav /> : null}
    </View>
  );
}

