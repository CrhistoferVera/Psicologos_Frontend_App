import { MessageCircle, UserRoundCog, WalletCards, LayoutDashboard } from "lucide-react-native";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appTheme } from "../../../theme/appTheme";

type NavItem = {
  key: string;
  label: string;
  route: string;
  icon: any;
};

const professionalAccent = appTheme.colors.success;

const items: NavItem[] = [
  { key: "dashboard", label: "Dashboard", route: "/(professional)/dashboard", icon: LayoutDashboard },
  { key: "messages", label: "Mensajes", route: "/(professional)/messages", icon: MessageCircle },
  { key: "earnings", label: "Ganancias", route: "/(professional)/earnings", icon: WalletCards },
  { key: "profile", label: "Perfil", route: "/(professional)/profile", icon: UserRoundCog },
];

function isActive(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export default function ProfessionalBottomNav() {
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
            <Icon size={20} color={active ? professionalAccent : appTheme.colors.textMuted} />
            <Text style={[styles.label, { color: active ? professionalAccent : appTheme.colors.textMuted }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
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
    width: 30,
    height: 3,
    borderRadius: 99,
    backgroundColor: professionalAccent,
  },
  label: {
    fontSize: 11,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
});
