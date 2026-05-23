import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import type { ReferralHistoryItem } from "../api/referralsApi";

const ROLE_LABEL: Record<string, string> = {
  PROFESSIONAL: "Psicólogo",
  ANFITRIONA:   "Anfitriona",
  USER:         "Cliente",
};


const TYPE_CONFIG: Record<string, {
  label: string;
  icon: "repeat-outline" | "checkmark-done-outline";
  headerBg: string;
  headerText: string;
  avatarBg: string;
  avatarText: string;
  badgeBg: string;
}> = {
  PRO_TO_PRO: {
    label:       "Recurrente",
    icon:        "repeat-outline",
    headerBg:    "#1E3A8A",
    headerText:  "#FFFFFF",
    avatarBg:    "#2563EB",
    avatarText:  "#FFFFFF",
    badgeBg:     "#3B82F6",
  },
  PRO_TO_USER: {
    label:       "Una sola vez",
    icon:        "checkmark-done-outline",
    headerBg:    "#064E3B",
    headerText:  "#FFFFFF",
    avatarBg:    "#059669",
    avatarText:  "#FFFFFF",
    badgeBg:     "#10B981",
  },
  USER_TO_USER: {
    label:       "Una sola vez",
    icon:        "checkmark-done-outline",
    headerBg:    "#064E3B",
    headerText:  "#FFFFFF",
    avatarBg:    "#059669",
    avatarText:  "#FFFFFF",
    badgeBg:     "#10B981",
  },
};

const TYPE_LABEL: Record<string, string> = {
  SESSION: "Sesión",
  PACKAGE: "Paquete",
};

function Avatar({ name, bg, color }: { name: string; bg: string; color: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { color }]}>{initials || "?"}</Text>
    </View>
  );
}

export default function ReferralRowCard({ item }: { item: ReferralHistoryItem }) {
  const fullName = item.referred.fullName || item.referred.email || "Usuario";
  const roleLabel = ROLE_LABEL[item.referred.role] ?? item.referred.role;
  const typeCfg = item.case ? TYPE_CONFIG[item.case] : null;
  const isOneTime = item.case === "PRO_TO_USER" || item.case === "USER_TO_USER";
  const rewardCollected = isOneTime && !!item.rewardPaidAt;
  const rewardPending = isOneTime && !item.rewardPaidAt;
  const hasRewards = item.rewards.length > 0;
  const lastReward = item.rewards[item.rewards.length - 1];

  return (
    <View style={styles.card}>

      {/* Header con color fuerte */}
      <View style={[styles.header, { backgroundColor: typeCfg?.headerBg ?? "#1E293B" }]}>
        <Avatar
          name={fullName}
          bg={typeCfg?.avatarBg ?? "#475569"}
          color={typeCfg?.avatarText ?? "#FFFFFF"}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{fullName}</Text>
          {item.referred.email ? (
            <Text style={styles.headerEmail}>{item.referred.email}</Text>
          ) : null}
        </View>
        {typeCfg ? (
          <View style={[styles.typeBadge, { backgroundColor: typeCfg.badgeBg }]}>
            <Ionicons name={typeCfg.icon} size={12} color="#FFFFFF" />
            <Text style={styles.typeBadgeText}>{typeCfg.label}</Text>
          </View>
        ) : null}
      </View>

      {/* Cuerpo blanco */}
      <View style={styles.body}>
        {/* Chips de info */}
        <View style={styles.chipsRow}>
          <Chip icon="person-outline" label={roleLabel} />
          {rewardCollected ? (
            <View style={[styles.chip, { backgroundColor: "#059669", borderColor: "#059669" }]}>
              <Ionicons name="checkmark-circle" size={11} color="#FFFFFF" />
              <Text style={[styles.chipText, { color: "#FFFFFF", fontFamily: appTheme.fonts.heading }]}>Recompensa cobrada</Text>
            </View>
          ) : rewardPending ? (
            <View style={[styles.chip, { backgroundColor: "#B45309", borderColor: "#B45309" }]}>
              <Ionicons name="time-outline" size={11} color="#FFFFFF" />
              <Text style={[styles.chipText, { color: "#FFFFFF", fontFamily: appTheme.fonts.heading }]}>Esperando primera compra</Text>
            </View>
          ) : null}
        </View>

        {/* Recompensas */}
        {hasRewards ? (
          <View style={styles.rewardsRow}>
            <Ionicons name="gift-outline" size={14} color={appTheme.colors.success} />
            <Text style={styles.rewardsText}>
              {item.rewards.length} {item.rewards.length === 1 ? "recompensa" : "recompensas"}
            </Text>
            {lastReward ? (
              <Text style={styles.rewardAmount}>
                · +{lastReward.rewardAmount.toFixed(2)} {lastReward.currency}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Chip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={11} color="#64748B" />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: appTheme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 16,
  },
  headerName: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 14,
  },
  headerEmail: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 11,
  },
  body: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  rewardsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  rewardsText: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  rewardAmount: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 13,
  },
});
