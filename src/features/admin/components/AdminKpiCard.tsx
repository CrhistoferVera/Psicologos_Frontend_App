import { ArrowUp, BarChart3, CircleDollarSign, Gift } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { useAdminResponsive } from "../hooks/useAdminResponsive";

type Props = {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "positive" | "warning";
};

const toneMap: Record<NonNullable<Props["tone"]>, { value: string; delta: string; iconBg: string; icon: any }> = {
  neutral: { value: "#1F3656", delta: "#5E7695", iconBg: "#EAF1FB", icon: BarChart3 },
  positive: { value: appTheme.colors.success, delta: appTheme.colors.success, iconBg: "#EAF7F0", icon: CircleDollarSign },
  warning: { value: "#D97706", delta: "#D97706", iconBg: "#FFF5E7", icon: Gift },
};

export default function AdminKpiCard({ label, value, delta, tone = "neutral" }: Props) {
  const { isMobile } = useAdminResponsive();
  const palette = toneMap[tone];
  const Icon = palette.icon;

  return (
    <AppCard style={[styles.card, { minWidth: isMobile ? 0 : 260, width: isMobile ? "100%" : undefined }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: palette.iconBg }]}>
          <Icon size={17} color={palette.value} />
        </View>
        <View style={styles.trendWrap}>
          <ArrowUp size={13} color={appTheme.colors.success} />
        </View>
      </View>

      <Text style={[styles.value, { color: palette.value }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.delta, { color: delta ? palette.delta : "#8AA0BA" }]}>{delta ?? "Sin variación"}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 260,
    minHeight: 165,
    borderRadius: 20,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  trendWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8E4EF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FCFF",
  },
  label: {
    color: "#5F7898",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  value: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
  },
  delta: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
});
