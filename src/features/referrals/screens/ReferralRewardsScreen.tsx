import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { appTheme } from "../../../theme/appTheme";
import { getMyReferrals } from "../api/referralsApi";
import RewardCard from "../components/RewardCard";

export default function ReferralRewardsScreen() {
  const router = useRouter();
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyReferrals();
      setRewards(data.history.flatMap((h) => h.rewards));
    } catch {
      setError("No se pudo cargar las recompensas.");
    } finally {
      setLoading(false);
    }
  }

  const totalBob = rewards.filter((r) => r.currency === "BOB").reduce((s, r) => s + r.rewardAmount, 0);
  const totalUsd = rewards.filter((r) => r.currency === "USD").reduce((s, r) => s + r.rewardAmount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
        </Pressable>
        <Text style={styles.title}>Recompensas recibidas</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.stateText}>Cargando...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : rewards.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="gift-outline" size={48} color={appTheme.colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin recompensas aún</Text>
          <Text style={styles.emptyText}>Cuando tus referidos realicen compras, tus recompensas aparecerán aquí.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {/* Resumen total */}
          <View style={styles.summaryCard}>
            <Ionicons name="gift" size={22} color="#FFFFFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Total ganado en recompensas</Text>
              <View style={styles.summaryAmounts}>
                {totalBob > 0 ? (
                  <Text style={styles.summaryAmount}>{totalBob.toFixed(2)} BOB</Text>
                ) : null}
                {totalUsd > 0 ? (
                  <Text style={styles.summaryAmount}>{totalUsd.toFixed(2)} USD</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{rewards.length}</Text>
              <Text style={styles.countLabel}>{rewards.length === 1 ? "pago" : "pagos"}</Text>
            </View>
          </View>

          {/* Lista de cards */}
          {rewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 22,
  },
  container: {
    padding: 14,
    paddingTop: 6,
    gap: 10,
  },
  summaryCard: {
    backgroundColor: "#1E293B",
    borderRadius: appTheme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryAmounts: {
    flexDirection: "row",
    gap: 10,
    marginTop: 3,
  },
  summaryAmount: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "800",
    fontSize: 16,
  },
  countBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "800",
    fontSize: 18,
  },
  countLabel: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: appTheme.fonts.body,
    fontSize: 10,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 16,
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
  },
  stateText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  errorText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
});
