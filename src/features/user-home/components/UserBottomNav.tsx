import { MessageCircle, Search, User, Wallet, House, Gift } from "lucide-react-native";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appTheme } from "../../../theme/appTheme";

type Item = {
  key: string;
  label: string;
  icon: any;
  route: string;
};

const items: Item[] = [
  { key: "home", label: "Inicio", icon: House, route: "/(user)/home" },
  { key: "professionals", label: "Buscar", icon: Search, route: "/(user)/professionals" },
  { key: "chats", label: "Chats", icon: MessageCircle, route: "/(user)/chats" },
  { key: "credits", label: "Créditos", icon: Wallet, route: "/(user)/credits" },
  { key: "profile", label: "Perfil", icon: User, route: "/(user)/profile" },
];

function isActive(pathname: string, route: string) {
  if (route === "/(user)/home") return pathname === "/(user)/home";
  return pathname.startsWith(route);
}

export default function UserBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.route);
        return (
          <Pressable key={item.key} style={styles.item} onPress={() => router.push(item.route as any)}>
            <View style={[styles.activeLine, { opacity: active ? 1 : 0 }]} />
            <Icon size={21} color={active ? appTheme.colors.primary : appTheme.colors.textMuted} />
            <Text style={[styles.label, { color: active ? appTheme.colors.primary : appTheme.colors.textMuted }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
      <Pressable style={styles.referralFab} onPress={() => router.push("/(user)/referrals" as any)}>
        <Gift size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: appTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    position: "relative",
  },
  item: {
    flex: 1,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 6,
    gap: 2,
  },
  activeLine: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 99,
    backgroundColor: appTheme.colors.primary,
  },
  label: {
    fontSize: 11,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  referralFab: {
    position: "absolute",
    right: 12,
    top: -14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: appTheme.colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
});

