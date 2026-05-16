import { StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { formatBob, formatUsd } from "../../../utils/money";

interface Props {
  withdrawableBalance: number;
  totalBalance: number;
  totalBalanceUsd: number;
  today: number;
  todayUsd: number;
  thisWeek: number;
  thisWeekUsd: number;
  grossBob: number;
  withdrawalsEnabled: boolean;
}

export default function EarningsSummaryTab({
  withdrawableBalance,
  totalBalance,
  totalBalanceUsd,
  today,
  todayUsd,
  thisWeek,
  thisWeekUsd,
  grossBob,
  withdrawalsEnabled,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Cartera Bolivianos (Bs)</Text>
        <Text style={styles.heroValue}>{formatBob(withdrawableBalance)}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>Hoy: {formatBob(today)}</Text>
          <Text style={styles.heroMeta}>Semana: {formatBob(thisWeek)}</Text>
        </View>
        {!withdrawalsEnabled ? (
          <Text style={styles.blockedText}>Retiros deshabilitados por configuración del sistema.</Text>
        ) : null}
      </View>

      <View style={[styles.heroCard, styles.heroCardUsd]}>
        <Text style={styles.heroLabel}>Cartera Dólares (USD)</Text>
        <Text style={styles.heroValue}>{formatUsd(totalBalanceUsd)}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>Hoy: {formatUsd(todayUsd)}</Text>
          <Text style={styles.heroMeta}>Semana: {formatUsd(thisWeekUsd)}</Text>
        </View>
      </View>

      <View style={styles.kpisRow}>
        <AppCard style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{formatBob(grossBob)}</Text>
          <Text style={styles.kpiLabel}>Ingresos históricos Bs</Text>
        </AppCard>
        <AppCard style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{formatBob(totalBalance)}</Text>
          <Text style={styles.kpiLabel}>Saldo actual</Text>
        </AppCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  heroCard: {
    borderRadius: 20,
    backgroundColor: "#3E7F61",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 8,
  },
  heroCardUsd: { backgroundColor: "#1E4D7B" },
  heroLabel: {
    color: "#DDF3E7",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  heroValue: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
  },
  heroMetaRow: { gap: 2 },
  heroMeta: {
    color: "#D7EFE3",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  blockedText: {
    color: "#FDE68A",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    marginTop: 4,
  },
  kpisRow: {
    flexDirection: "row",
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  kpiValue: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  kpiLabel: {
    marginTop: 4,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
});
