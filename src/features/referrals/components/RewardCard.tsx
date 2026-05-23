import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { appTheme } from "../../../theme/appTheme";
import type { ReferralReward } from "../api/referralsApi";

type Props = {
  reward: ReferralReward;
};

const TYPE_CONFIG: Record<string, {
  label: string;
  icon: "videocam" | "albums";
  colors: [string, string];
}> = {
  SESSION: { label: "Sesión",  icon: "videocam", colors: ["#7C3AED", "#A78BFA"] },
  PACKAGE: { label: "Paquete", icon: "albums",   colors: ["#0369A1", "#38BDF8"] },
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleString("es-BO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RewardCard({ reward }: Props) {
  const type = TYPE_CONFIG[reward.type] ?? { label: reward.type, icon: "gift" as any, colors: ["#1E293B", "#475569"] as [string, string] };
  const isUsd = reward.currency === "USD";

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={type.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconWrap}
      >
        <Ionicons name={type.icon} size={20} color="#FFFFFF" />
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{type.label}</Text>
            <Text style={styles.date}>{formatDateTime(reward.createdAt)}</Text>
          </View>
          <Text style={[styles.amount, { marginTop: 2 }]}>
            +{reward.rewardAmount.toFixed(2)}{" "}
            <Text style={isUsd ? styles.currencyUsd : styles.currencyBob}>{reward.currency}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  label: {
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
  currencyBob: {
    color: "#16A34A",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 15,
  },
  currencyUsd: {
    color: "#1D4ED8",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 15,
  },
  date: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
});
