import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import BottomNav from "@/src/components/Menu/BottomNav";

export default function ClienteLayout() {
  const pathname = usePathname();
  const hideNav =
    pathname.includes("/chat/") ||
    pathname.includes("story-viewer") ||
    pathname.includes("/call");

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {!hideNav && <BottomNav role="cliente" />}
    </View>
  );
}
