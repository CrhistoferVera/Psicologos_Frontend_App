import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
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

export default function AdminLayout({ title, subtitle, showPeriodTabs = false, onRefresh, children }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.brandWrap}>
          <View style={styles.brandLogo}>
            <Text style={styles.brandLogoText}>▶</Text>
          </View>
          <Text style={styles.brandTitle}>PsyConnect</Text>
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
    justifyContent: "flex-start",
    paddingHorizontal: 22,
    gap: 16,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 220,
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
