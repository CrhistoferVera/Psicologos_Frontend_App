import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { appTheme } from "../../../theme/appTheme";
import { formatBob, formatUsd } from "../../../utils/money";
import type { EarningTransaction } from "../../../api/wallet";

function formatDateTime(iso?: string) {
  if (!iso) return "Sin fecha";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleString("es-BO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function getServiceConfig(service: string) {
  const s = (service ?? "").toLowerCase();
  if (s.includes("video") || s.includes("videollamada"))
    return { icon: "videocam" as const, label: "Videollamada", colors: ["#7C3AED", "#A78BFA"] as [string, string] };
  if (s.includes("call") || s.includes("llamada"))
    return { icon: "call" as const, label: "Llamada", colors: ["#0369A1", "#38BDF8"] as [string, string] };
  if (s.includes("chat") || s.includes("message") || s.includes("mensaje"))
    return { icon: "chatbubble-ellipses" as const, label: "Chat", colors: ["#065F46", "#34D399"] as [string, string] };
  return { icon: "cash" as const, label: "Ganancia", colors: ["#1565C0", "#42A5F5"] as [string, string] };
}

interface Props {
  transaction: EarningTransaction;
}

export default function EarningTransactionCard({ transaction }: Props) {
  const currency = String(transaction.currency ?? "BOB").toUpperCase() === "USD" ? "USD" : "BOB";
  const amount = currency === "USD"
    ? formatUsd(Number(transaction.amount ?? 0))
    : formatBob(Number(transaction.amount ?? 0));
  const { icon, label, colors } = getServiceConfig(transaction.service ?? "");

  return (
    <View style={styles.wrapper}>
      {/* Ícono lateral con gradiente */}
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </LinearGradient>

      {/* Contenido */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.serviceLabel}>{transaction.service || label}</Text>
          <Text style={styles.amount}>{amount}</Text>
        </View>

        {transaction.clientName ? (
          <Text style={styles.client} numberOfLines={1}>
            👤 {transaction.clientName}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          <View style={[styles.typeBadge, { backgroundColor: colors[0] + "18" }]}>
            <Text style={[styles.typeBadgeText, { color: colors[0] }]}>{label}</Text>
          </View>
          <View style={[styles.currencyBadge, currency === "USD" ? styles.currencyUsd : styles.currencyBob]}>
            <Text style={styles.currencyText}>{currency}</Text>
          </View>
          <Text style={styles.date}>{formatDateTime(transaction.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  serviceLabel: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  amount: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  client: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 10,
    fontWeight: "700",
  },
  currencyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currencyBob: { backgroundColor: "#DCFCE7" },
  currencyUsd: { backgroundColor: "#DBEAFE" },
  currencyText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E4D7B",
    fontFamily: appTheme.fonts.body,
  },
  date: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    marginLeft: "auto",
  },
});
