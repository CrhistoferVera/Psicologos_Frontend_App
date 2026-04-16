import { CalendarRange } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";

type Props = {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
};

export default function AdminHeader({ title, subtitle, onRefresh }: Props) {
  return (
    <View style={styles.wrap}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Pressable style={styles.periodChip} onPress={onRefresh}>
        <CalendarRange size={16} color={appTheme.colors.primary} />
        <Text style={styles.periodText}>Periodo actual</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  periodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EEF5FB",
  },
  periodText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
});
