import { useMemo } from "react";
import { Settings, Users, UserRoundCheck, Landmark, Gift, Layers, LayoutDashboard, LogOut } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";

type Item = {
  key: string;
  label: string;
  route: string;
  icon: any;
};

const items: Item[] = [
  { key: "overview", label: "Overview", route: "/admin/overview", icon: LayoutDashboard },
  { key: "users", label: "Users", route: "/admin/users", icon: Users },
  { key: "professionals", label: "Professionals", route: "/admin/professionals", icon: UserRoundCheck },
  { key: "finance", label: "Finance", route: "/admin/finance", icon: Landmark },
  { key: "referrals", label: "Referrals", route: "/admin/referrals", icon: Gift },
  { key: "sections", label: "Sections", route: "/admin/sections", icon: Layers },
  { key: "config", label: "Config", route: "/admin/config", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const activeRoute = useMemo(() => {
    const match = items.find((item) => pathname === item.route || pathname.startsWith(`${item.route}/`));
    return match?.route ?? "/admin/overview";
  }, [pathname]);

  return (
    <View style={styles.sidebar}>
      <View style={styles.brandWrap}>
        <View style={styles.brandDot} />
        <View>
          <Text style={styles.brandTitle}>Psicologos Admin</Text>
          <Text style={styles.brandSub}>Panel ejecutivo</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.navList}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.route === activeRoute;
          return (
            <Pressable key={item.key} style={[styles.navItem, active && styles.navItemActive]} onPress={() => router.push(item.route as any)}>
              <Icon size={17} color={active ? "#FFFFFF" : "#C4D3E2"} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.userText}>{user?.email ?? "admin@local"}</Text>
        <Pressable
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            router.replace("/(public)/auth");
          }}
        >
          <LogOut size={16} color="#F8FAFC" />
          <Text style={styles.logoutLabel}>Cerrar sesion</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 248,
    backgroundColor: "#1E2A3A",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: "#273548",
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  brandDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#5B9BD5",
  },
  brandTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontFamily: "PlusJakartaSans-Bold",
    fontWeight: "700",
  },
  brandSub: {
    color: "#A8BED5",
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  navList: {
    gap: 6,
    paddingVertical: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navItemActive: {
    backgroundColor: "#5B9BD5",
  },
  navLabel: {
    color: "#C4D3E2",
    fontFamily: "Inter-Regular",
    fontSize: 13,
    fontWeight: "600",
  },
  navLabelActive: {
    color: "#FFFFFF",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#2D3D53",
    paddingTop: 12,
    gap: 8,
  },
  userText: {
    color: "#A8BED5",
    fontFamily: "Inter-Regular",
    fontSize: 11,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#31455E",
  },
  logoutLabel: {
    color: "#F8FAFC",
    fontFamily: "Inter-Regular",
    fontSize: 12,
    fontWeight: "700",
  },
});
