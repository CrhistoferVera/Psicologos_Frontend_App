import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { useAdminResponsive } from "../hooks/useAdminResponsive";

type Props = {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  children: ReactNode;
};

export default function AdminLayout({ title, subtitle, onRefresh, children }: Props) {
  const { isMobile, isCompactLayout, contentPadding } = useAdminResponsive();

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { minHeight: isMobile ? 62 : 74, paddingHorizontal: contentPadding }]}>
        <View style={styles.brandWrap}>
          <View style={[styles.brandLogo, { width: isMobile ? 34 : 42, height: isMobile ? 34 : 42, borderRadius: isMobile ? 10 : 12 }]}>
            <Text style={styles.brandLogoText}>SA</Text>
          </View>
          <Text style={[styles.brandTitle, { fontSize: isMobile ? 22 : 30 }]}>SanaMente</Text>
        </View>
      </View>

      {!isCompactLayout ? (
        <View style={[styles.breadcrumbBar, { paddingHorizontal: contentPadding }]}>
          <Text style={styles.crumbMuted}>SanaMente</Text>
          <Text style={styles.crumbSep}>{">"}</Text>
          <Text style={styles.crumbStrong}>Panel Admin</Text>
        </View>
      ) : null}

      <View style={[styles.body, { flexDirection: isCompactLayout ? "column" : "row" }]}>
        <AdminSidebar compact={isCompactLayout} />
        <View style={styles.content}>
          <AdminHeader title={title} subtitle={subtitle} onRefresh={onRefresh} />
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
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 16,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 220,
  },
  brandLogo: {
    backgroundColor: "#7A95CB",
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogoText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  brandTitle: {
    color: "#1F3656",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  breadcrumbBar: {
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
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
