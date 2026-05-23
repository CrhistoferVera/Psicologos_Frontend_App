import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import type { MyReferralsData } from "../api/referralsApi";

type Props = {
  data: MyReferralsData | null;
};

export default function ReferralStatsRow({ data }: Props) {
  const allRewards = data?.history.flatMap((h) => h.rewards) ?? [];
  const totalBob = allRewards.filter((r) => r.currency === "BOB").reduce((s, r) => s + r.rewardAmount, 0);
  const totalUsd = allRewards.filter((r) => r.currency === "USD").reduce((s, r) => s + r.rewardAmount, 0);
  const rewardPercent = data?.rules.referralRewardPercent ?? 5;

  return (
    <View style={styles.row}>
      {/* Invitados */}
      <View style={[styles.card, styles.cardBlue]}>
        <View style={styles.iconWrap}>
          <Ionicons name="people" size={18} color="#1D4ED8" />
        </View>
        <Text style={styles.value}>{data?.invitedCount ?? 0}</Text>
        <Text style={styles.label}>Invitados</Text>
      </View>

      {/* Total ganado */}
      <LinearGradient
        colors={["#064E3B", "#065F46"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.cardWide]}
      >
        <View style={styles.earnedHeader}>
          <Ionicons name="gift" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.earnedTitle}>Total ganado</Text>
        </View>
        {totalBob > 0 || totalUsd > 0 ? (
          <View style={styles.earnedAmounts}>
            {totalBob > 0 ? (
              <View style={styles.amountRow}>
                <Text style={styles.earnedAmount}>{totalBob.toFixed(2)}</Text>
                <Text style={styles.earnedCurrency}>BOB</Text>
              </View>
            ) : null}
            {totalUsd > 0 ? (
              <View style={styles.amountRow}>
                <Text style={styles.earnedAmount}>{totalUsd.toFixed(2)}</Text>
                <Text style={[styles.earnedCurrency, { color: "#60A5FA" }]}>USD</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.earnedZero}>0.00</Text>
        )}
      </LinearGradient>

      {/* Recompensa % */}
      <View style={[styles.card, styles.cardAmber]}>
        <View style={[styles.iconWrap, { backgroundColor: "#FEF3C7" }]}>
          <Ionicons name="star" size={18} color="#B45309" />
        </View>
        <Text style={[styles.value, { color: "#B45309" }]}>{rewardPercent}%</Text>
        <Text style={styles.label}>Comisión</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    borderRadius: appTheme.radius.lg,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardBlue: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  cardWide: {
    flex: 1.4,
  },
  cardAmber: {
    flex: 1,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    color: "#1D4ED8",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "800",
    fontSize: 22,
  },
  label: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  earnedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  earnedTitle: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  earnedAmounts: {
    gap: 2,
    alignItems: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  earnedAmount: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "800",
    fontSize: 17,
  },
  earnedCurrency: {
    color: "#34D399",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 11,
  },
  earnedZero: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 20,
  },
});
