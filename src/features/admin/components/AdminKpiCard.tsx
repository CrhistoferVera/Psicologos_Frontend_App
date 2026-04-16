import { StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";

type Props = {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "positive" | "warning";
};

export default function AdminKpiCard({ label, value, delta, tone = "neutral" }: Props) {
  const toneColor =
    tone === "positive" ? appTheme.colors.success : tone === "warning" ? "#B45309" : appTheme.colors.text;

  return (
    <AppCard style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: toneColor }]}>{value}</Text>
      {delta ? <Text style={[styles.delta, { color: toneColor }]}>{delta}</Text> : <View style={{ height: 18 }} />}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 180,
    minHeight: 112,
  },
  label: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  value: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  delta: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
});
