import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import { formatBob, formatUsd } from "../../../utils/money";
import type { PenaltyTransaction } from "../../../api/wallet";

function formatDate(iso: string | null, fallback: string) {
  const d = new Date(iso ?? fallback);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

interface Props {
  tx: PenaltyTransaction;
}

export default function PenaltyTransactionCard({ tx }: Props) {
  const isBoth = tx.event === "NO_SHOW_BOTH_EARNING_REVERSAL";
  const fmt = tx.currency === "USD" ? formatUsd : formatBob;
  const date = formatDate(tx.scheduledStartAt, tx.createdAt);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.sessionTitle} numberOfLines={1}>{tx.sessionTitle}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tx.currency}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {tx.earningReversal > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Reversión de ganancia</Text>
          <Text style={styles.value}>− {fmt(tx.earningReversal)}</Text>
        </View>
      )}

      {!isBoth && tx.penaltyPercent != null && tx.penaltyAmount != null && (
        <View style={styles.row}>
          <Text style={styles.label}>Multa ({tx.penaltyPercent}%)</Text>
          <Text style={styles.value}>− {fmt(tx.penaltyAmount)}</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total descontado</Text>
        <Text style={styles.totalValue}>− {fmt(tx.totalDeduction)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF7F7",
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  sessionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
  },
  date: {
    fontSize: 11,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  badge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B91C1C",
    fontFamily: appTheme.fonts.body,
  },
  divider: {
    height: 1,
    backgroundColor: "#FECACA",
    marginVertical: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  value: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
    fontFamily: appTheme.fonts.body,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
    fontFamily: appTheme.fonts.body,
  },
});
