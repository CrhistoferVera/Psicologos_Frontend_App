import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { formatBob, formatUsd } from "../../../utils/money";

interface Props {
  balance: number;
  withdrawableBalance: number;
  lockedBob: number;
  balanceUsd: number;
  withdrawableUsd: number;
  lockedUsd: number;
  today: number;
  todayUsd: number;
  thisWeek: number;
  thisWeekUsd: number;
  grossBob: number;
  withdrawalsEnabled: boolean;
  onViewEarnings?: () => void;
  onWithdraw?: () => void;
}

export default function EarningsSummaryTab({
  balance,
  withdrawableBalance,
  lockedBob,
  balanceUsd,
  withdrawableUsd,
  lockedUsd,
  today,
  todayUsd,
  thisWeek,
  thisWeekUsd,
  grossBob,
  withdrawalsEnabled,
  onViewEarnings,
  onWithdraw,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Cartera Bolivianos (Bs)</Text>
        <Text style={styles.heroValue}>{formatBob(balance)}</Text>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Ionicons name="lock-closed-outline" size={13} color="#A7D9BC" />
            <Text style={styles.breakdownText}>{formatBob(lockedBob)} bloqueado</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Ionicons name="checkmark-circle-outline" size={13} color="#A7D9BC" />
            <Text style={styles.breakdownText}>{formatBob(withdrawableBalance)} disponible</Text>
          </View>
        </View>

        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>Hoy: {formatBob(today)}</Text>
          <Text style={styles.heroMeta}>Semana: {formatBob(thisWeek)}</Text>
        </View>

        {!withdrawalsEnabled ? (
          <Text style={styles.blockedText}>Retiros deshabilitados por el sistema.</Text>
        ) : null}
      </View>

      <View style={[styles.heroCard, styles.heroCardUsd]}>
        <Text style={styles.heroLabel}>Cartera Dólares (USD)</Text>
        <Text style={styles.heroValue}>{formatUsd(balanceUsd)}</Text>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Ionicons name="lock-closed-outline" size={13} color="#93C5FD" />
            <Text style={styles.breakdownText}>{formatUsd(lockedUsd)} bloqueado</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Ionicons name="checkmark-circle-outline" size={13} color="#93C5FD" />
            <Text style={styles.breakdownText}>{formatUsd(withdrawableUsd)} disponible</Text>
          </View>
        </View>

        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>Hoy: {formatUsd(todayUsd)}</Text>
          <Text style={styles.heroMeta}>Semana: {formatUsd(thisWeekUsd)}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.btnOutline} onPress={onViewEarnings}>
          <Text style={styles.btnOutlineText}>Ver ganancias</Text>
        </Pressable>
        <Pressable
          style={[styles.btnSuccess, !withdrawalsEnabled && styles.btnDisabled]}
          onPress={withdrawalsEnabled ? onWithdraw : undefined}
        >
          <Text style={styles.btnSuccessText}>Solicitar retiro</Text>
        </Pressable>
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
  breakdownRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  breakdownText: {
    color: "#D7EFE3",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  heroMetaRow: {
    flexDirection: "row",
    gap: 16,
  },
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
    textAlign: "center",
  },
  kpiLabel: {
    marginTop: 4,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  btnOutline: {
    flex: 1,
    minHeight: 40,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  btnOutlineText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  btnSuccess: {
    flex: 1,
    minHeight: 40,
    borderRadius: 18,
    backgroundColor: "#3E7F61",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  btnSuccessText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
