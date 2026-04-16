import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

type Props = {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  children: ReactNode;
};

export default function AdminLayout({ title, subtitle, onRefresh, children }: Props) {
  return (
    <View style={styles.root}>
      <AdminSidebar />
      <View style={styles.content}>
        <AdminHeader title={title} subtitle={subtitle} onRefresh={onRefresh} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: appTheme.colors.background,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
