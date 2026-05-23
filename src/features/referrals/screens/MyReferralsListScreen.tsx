import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { appTheme } from "../../../theme/appTheme";
import { getMyReferrals, type ReferralHistoryItem } from "../api/referralsApi";
import ReferralRowCard from "../components/ReferralRowCard";

export default function MyReferralsListScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyReferrals();
      setHistory(data.history);
    } catch {
      setError("No se pudo cargar los referidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
        </Pressable>
        <Text style={styles.title}>Mis referidos</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Ionicons name="refresh" size={18} color={appTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.stateText}>Cargando...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={48} color={appTheme.colors.textMuted} />
          <Text style={styles.emptyTitle}>Aún no tienes referidos</Text>
          <Text style={styles.emptyText}>Comparte tu código y empieza a ganar recompensas.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.summaryCard}>
            <Ionicons name="people" size={22} color="#FFFFFF" />
            <Text style={styles.summaryText}>
              Tienes <Text style={styles.summaryBold}>{history.length}</Text> {history.length === 1 ? "persona invitada" : "personas invitadas"}
            </Text>
          </View>
          {history.map((item) => (
            <ReferralRowCard key={item.id} item={item} />
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
    flex: 1,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 22,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
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
    gap: 10,
  },
  summaryText: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  summaryBold: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "800",
    fontSize: 16,
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
