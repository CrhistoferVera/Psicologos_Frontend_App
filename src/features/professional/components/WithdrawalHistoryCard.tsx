import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import { formatBob, formatUsd } from "../../../utils/money";
import type { WithdrawalRequest } from "../../../api/wallet";

function formatDate(iso?: string) {
  if (!iso) return "Sin fecha";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleString("es-BO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function statusMeta(status: WithdrawalRequest["status"]) {
  if (status === "APPROVED") return { label: "Aprobado", bg: "#DCFCE7", text: "#15803D", border: "#16A34A", glow: "rgba(91,155,213," };
  if (status === "REJECTED") return { label: "Rechazado", bg: "#FEE2E2", text: "#B91C1C", border: "#DC2626", glow: "rgba(91,155,213," };
  return { label: "Pendiente", bg: "#FEF3C7", text: "#92400E", border: "#F59E0B", glow: "rgba(91,155,213," };
}

interface Props {
  withdrawal: WithdrawalRequest;
  onPress: (withdrawal: WithdrawalRequest) => void;
}

export default function WithdrawalHistoryCard({ withdrawal, onPress }: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const status = statusMeta(withdrawal.status);
  const currency = (withdrawal.currency ?? "BOB") as "BOB" | "USD";
  const rawAmount = Number(withdrawal.amountBs ?? withdrawal.soles ?? 0);
  const amount = currency === "USD" ? formatUsd(rawAmount) : formatBob(rawAmount);
  const isCrypto = withdrawal.method === "CRYPTO";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const borderOpacity = shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.25, 1, 0.25] });
  const borderColor = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      `${status.glow}0.25)`,
      `${status.glow}1)`,
      `${status.glow}0.25)`,
    ],
  });
  const accentOpacity = shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] });

  return (
    <Pressable
      style={({ pressed }) => [styles.wrapper, { opacity: pressed ? 0.88 : 1 }]}
      onPress={() => onPress(withdrawal)}
    >
      {/* Animated glow border */}
      <Animated.View style={[styles.glowBorder, { borderColor, opacity: borderOpacity }]} />

      <View style={styles.card}>
        {/* Animated left accent bar */}
        <Animated.View style={[styles.accent, { backgroundColor: appTheme.colors.primary, opacity: accentOpacity }]} />

        <View style={styles.body}>
          {/* Top row: method chip + status badge */}
          <View style={styles.topRow}>
            <View style={[styles.methodChip, isCrypto ? styles.chipCrypto : styles.chipBank]}>
              <Ionicons
                name={isCrypto ? "logo-bitcoin" : "card-outline"}
                size={11}
                color={isCrypto ? "#5B21B6" : "#0369A1"}
              />
              <Text style={[styles.chipText, isCrypto ? styles.chipTextCrypto : styles.chipTextBank]}>
                {isCrypto ? "CRYPTO" : "BANCO"}
              </Text>
            </View>

            <View style={{ flex: 1 }} />

            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: status.border }]} />
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>

          {/* Amount */}
          <Text style={styles.amount}>{amount}</Text>

          {/* Method detail */}
          {isCrypto ? (
            <Text style={styles.detail} numberOfLines={1}>
              {withdrawal.cryptoCurrency ?? "USDT"} · {withdrawal.cryptoNetwork ?? "BEP20"}
              {withdrawal.cryptoAddress ? `  ${withdrawal.cryptoAddress}` : ""}
            </Text>
          ) : (
            <Text style={styles.detail} numberOfLines={1}>
              {[withdrawal.bankName, withdrawal.accountNumber, withdrawal.accountHolderName]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer row */}
          <View style={styles.footerRow}>
            <Ionicons name="time-outline" size={11} color={appTheme.colors.textMuted} />
            <Text style={styles.date}>{formatDate(withdrawal.createdAt)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  glowBorder: {
    position: "absolute",
    inset: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    zIndex: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: appTheme.colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  methodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipBank: { backgroundColor: "#E0F2FE" },
  chipCrypto: { backgroundColor: "#EDE9FE" },
  chipText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: appTheme.fonts.body,
  },
  chipTextBank: { color: "#0369A1" },
  chipTextCrypto: { color: "#5B21B6" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: appTheme.fonts.body,
  },
  amount: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  detail: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: appTheme.colors.border,
    marginVertical: 4,
    opacity: 0.6,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  date: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
});
