import { CalendarRange } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";

type Props = {
  title: string;
  subtitle: string;
  showPeriodTabs?: boolean;
  onRefresh?: () => void;
};

const periods = ["Esta semana", "Este mes", "Este año"];

export default function AdminHeader({ title, subtitle, showPeriodTabs = false, onRefresh }: Props) {
  return (
    <View style={styles.wrap}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {showPeriodTabs ? (
        <View style={styles.periodWrap}>
          {periods.map((period) => {
            const active = period === "Este mes";
            return (
              <Pressable key={period} style={[styles.periodChip, active && styles.periodChipActive]} onPress={onRefresh}>
                <Text style={[styles.periodText, active && styles.periodTextActive]}>{period}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Pressable style={styles.refreshChip} onPress={onRefresh}>
          <CalendarRange size={15} color={appTheme.colors.primary} />
          <Text style={styles.refreshText}>Actualizar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 30,
    paddingTop: 28,
    paddingBottom: 18,
    backgroundColor: appTheme.colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: "#1F3656",
    fontFamily: appTheme.fonts.heading,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
  },
  subtitle: {
    marginTop: 4,
    color: "#5D7390",
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    lineHeight: 22,
  },
  periodWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  periodChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D5E0EC",
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  periodChipActive: {
    borderColor: appTheme.colors.primary,
    backgroundColor: appTheme.colors.primary,
  },
  periodText: {
    color: "#5D7390",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  periodTextActive: {
    color: "#FFFFFF",
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
