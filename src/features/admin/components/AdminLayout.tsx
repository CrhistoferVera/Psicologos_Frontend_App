import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Layers, Monitor, Smartphone, Stethoscope, Palette } from "lucide-react-native";
import { appTheme } from "../../../theme/appTheme";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

type Props = {
  title: string;
  subtitle: string;
  showPeriodTabs?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
};

const topItems = [
  { key: "resumen", label: "Resumen", icon: Layers },
  { key: "usuario", label: "App Usuario", icon: Smartphone },
  { key: "professional", label: "App Professional", icon: Stethoscope },
  { key: "admin", label: "Panel Admin", icon: Monitor, active: true },
  { key: "design", label: "Design System", icon: Palette },
];

export default function AdminLayout({ title, subtitle, showPeriodTabs = false, onRefresh, children }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.brandWrap}>
          <View style={styles.brandLogo}>
            <Text style={styles.brandLogoText}>▶</Text>
          </View>
          <Text style={styles.brandTitle}>PsyConnect</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>Propuesta UX/UI</Text>
          </View>
        </View>

        <View style={styles.topNav}>
          {topItems.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable key={item.key} style={[styles.topNavItem, item.active && styles.topNavItemActive]}>
                <Icon size={15} color={item.active ? appTheme.colors.primary : "#7087A5"} />
                <Text style={[styles.topNavLabel, item.active && styles.topNavLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.versionPill}>
          <Text style={styles.versionText}>v1.0 · Abril 2026</Text>
        </View>
      </View>

      <View style={styles.breadcrumbBar}>
        <Text style={styles.crumbMuted}>PsyConnect</Text>
        <Text style={styles.crumbSep}>›</Text>
        <Text style={styles.crumbStrong}>Panel Admin</Text>
      </View>

      <View style={styles.body}>
        <AdminSidebar />
        <View style={styles.content}>
          <AdminHeader title={title} subtitle={subtitle} showPeriodTabs={showPeriodTabs} onRefresh={onRefresh} />
          <View style={styles.stackWrap}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  topBar: {
    minHeight: 74,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    gap: 16,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 280,
  },
  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#7A95CB",
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  brandTitle: {
    color: "#1F3656",
    fontFamily: appTheme.fonts.heading,
    fontSize: 30,
    fontWeight: "700",
  },
  badgePill: {
    borderRadius: 999,
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  topNavItem: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topNavItemActive: {
    backgroundColor: "#EAF3FF",
  },
  topNavLabel: {
    color: "#5E7695",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  topNavLabelActive: {
    color: appTheme.colors.primary,
    fontWeight: "700",
  },
  versionPill: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#B8DEC7",
    backgroundColor: "#EAF8EF",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  versionText: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  breadcrumbBar: {
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  crumbMuted: {
    color: "#6A81A0",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  crumbSep: {
    color: "#9CB0C7",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  crumbStrong: {
    color: "#203A5C",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    backgroundColor: appTheme.colors.background,
  },
  stackWrap: {
    flex: 1,
    minHeight: 0,
  },
});
