import { CalendarRange } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";
import { useAdminResponsive } from "../hooks/useAdminResponsive";

type Props = {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
};

export default function AdminHeader({ title, subtitle, onRefresh }: Props) {
  const { isMobile, contentPadding } = useAdminResponsive();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingHorizontal: contentPadding,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
        },
      ]}
    >
      <View>
        <Text style={[styles.title, { fontSize: isMobile ? 20 : 24, lineHeight: isMobile ? 26 : 30 }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <Pressable style={styles.refreshChip} onPress={onRefresh}>
        <CalendarRange size={15} color={appTheme.colors.primary} />
        <Text style={styles.refreshText}>Actualizar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 28,
    paddingBottom: 18,
    backgroundColor: appTheme.colors.background,
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: "#1F3656",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    color: "#5D7390",
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    lineHeight: 22,
  },
  refreshChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  refreshText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
});
