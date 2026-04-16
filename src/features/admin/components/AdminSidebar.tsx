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
  badge?: string;
};

const items: Item[] = [
  { key: "overview", label: "Dashboard", route: "/admin/overview", icon: LayoutDashboard },
  { key: "users", label: "Usuarios", route: "/admin/users", icon: Users, badge: "1.2k" },
  { key: "professionals", label: "Profesionales", route: "/admin/professionals", icon: UserRoundCheck, badge: "8" },
  { key: "sections", label: "Secciones", route: "/admin/sections", icon: Layers },
  { key: "finance", label: "Finanzas", route: "/admin/finance", icon: Landmark },
  { key: "referrals", label: "Referidos", route: "/admin/referrals", icon: Gift },
  { key: "config", label: "Configuración", route: "/admin/config", icon: Settings },
];

function initialsFromEmail(email?: string | null) {
  if (!email) return "A";
  return email[0]?.toUpperCase() ?? "A";
}

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
        <View style={styles.brandLogo}>
          <Text style={styles.brandLogoText}>P</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>PsyConnect</Text>
          <Text style={styles.brandSub}>Panel Admin</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.navList}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.route === activeRoute;
          return (
            <Pressable key={item.key} style={[styles.navItem, active && styles.navItemActive]} onPress={() => router.push(item.route as any)}>
              <Icon size={18} color={active ? "#5B9BD5" : "#B5C7DA"} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.accountBox}>
          <View style={styles.accountAvatar}>
            <Text style={styles.accountAvatarText}>{initialsFromEmail(user?.email)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountName}>Admin General</Text>
            <Text style={styles.accountMail}>{user?.email ?? "admin@psyconnect.com"}</Text>
          </View>
        </View>

        <Pressable
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            router.replace("/(public)/auth");
          }}
        >
          <LogOut size={16} color="#9AB0C8" />
          <Text style={styles.logoutLabel}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 274,
    backgroundColor: "#1E2A3A",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: "#2B3B50",
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#748FCA",
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogoText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
    fontWeight: "700",
    fontSize: 20,
  },
  brandTitle: {
    color: "#F8FAFC",
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 18,
    fontWeight: "700",
  },
  brandSub: {
    color: "#8FA6C0",
    fontSize: 13,
    fontFamily: "Inter-Regular",
  },
  navList: {
    gap: 7,
    paddingVertical: 6,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  navItemActive: {
    backgroundColor: "#2C4765",
    borderWidth: 1,
    borderColor: "#3B5D82",
  },
  navLabel: {
    color: "#D0DBE8",
    fontFamily: "Inter-Regular",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  navLabelActive: {
    color: "#5B9BD5",
    fontWeight: "700",
  },
  badge: {
    minWidth: 30,
    borderRadius: 999,
    backgroundColor: "#334A64",
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
  badgeText: {
    color: "#BFD0E4",
    fontFamily: "Inter-Regular",
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#2D3D53",
    paddingTop: 12,
    gap: 8,
  },
  accountBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 6,
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#2E4764",
    alignItems: "center",
    justifyContent: "center",
  },
  accountAvatarText: {
    color: "#77A9DD",
    fontFamily: "Inter-Regular",
    fontSize: 16,
    fontWeight: "700",
  },
  accountName: {
    color: "#E4EDF7",
    fontFamily: "Inter-Regular",
    fontSize: 15,
    fontWeight: "700",
  },
  accountMail: {
    color: "#8FA6C0",
    fontFamily: "Inter-Regular",
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#26384D",
  },
  logoutLabel: {
    color: "#BED0E4",
    fontFamily: "Inter-Regular",
    fontSize: 13,
    fontWeight: "600",
  },
});
