import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getProfessionalDashboardSnapshot, updateMyProfessionalProfile } from "../api/professionalApi";
import ProfessionalStatCard from "../components/ProfessionalStatCard";

export default function ProfessionalDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const data = await getProfessionalDashboardSnapshot();
      setProfile(data.profile);
      setSummary(data.summary);
      setEarnings(data.earnings);
      setChats(data.chats.slice(0, 5));
    } catch {
      setError("No se pudo cargar el dashboard profesional.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleOnline(nextValue: boolean) {
    if (!profile) return;
    try {
      setUpdatingStatus(true);
      setProfile((prev: any) => ({ ...prev, isOnline: nextValue }));
      await updateMyProfessionalProfile({ isOnline: nextValue });
    } catch {
      setProfile((prev: any) => ({ ...prev, isOnline: !nextValue }));
      setError("No se pudo actualizar tu disponibilidad.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  const recentTransactions = useMemo(
    () => (Array.isArray(earnings?.transactions) ? earnings.transactions.slice(0, 4) : []),
    [earnings],
  );

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Panel profesional</Text>
            <Text style={styles.title}>Hola, {profile?.firstName || "Profesional"}</Text>
          </View>
          <View style={styles.onlineWrap}>
            <Text style={styles.onlineLabel}>{profile?.isOnline ? "Online" : "Offline"}</Text>
            <Switch
              value={Boolean(profile?.isOnline)}
              onValueChange={handleToggleOnline}
              trackColor={{ false: "#CBD5E1", true: "#A7D6BB" }}
              thumbColor={profile?.isOnline ? appTheme.colors.success : "#FFFFFF"}
              disabled={updatingStatus}
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <Text style={styles.loading}>Cargando dashboard...</Text> : null}

        <AppCard>
          <Text style={styles.earningsLabel}>Ganancia acumulada</Text>
          <Text style={styles.earningsValue}>{Number(summary?.totalBalance ?? 0).toFixed(2)} creditos</Text>
          <Text style={styles.earningsHint}>Incluye ganancias netas reales, excluye creditos promocionales.</Text>
        </AppCard>

        <View style={styles.statsRow}>
          <ProfessionalStatCard label="Hoy" value={`${Number(summary?.today ?? 0).toFixed(2)} cr`} highlight />
          <ProfessionalStatCard label="Esta semana" value={`${Number(summary?.thisWeek ?? 0).toFixed(2)} cr`} />
        </View>
        <View style={styles.statsRow}>
          <ProfessionalStatCard label="Chats activos" value={String(chats.length)} />
          <ProfessionalStatCard label="No leidos" value={String(summary?.unreadChats ?? 0)} />
        </View>

        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={() => router.push("/(professional)/messages") as any}>
            <Text style={styles.quickTitle}>Mensajes</Text>
            <Text style={styles.quickMeta}>Responder conversaciones</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={() => router.push("/(professional)/earnings") as any}>
            <Text style={styles.quickTitle}>Ganancias</Text>
            <Text style={styles.quickMeta}>Ver movimientos y retiros</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={() => router.push("/(professional)/profile") as any}>
            <Text style={styles.quickTitle}>Editar perfil</Text>
            <Text style={styles.quickMeta}>Bio, precios y disponibilidad</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        {recentTransactions.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyText}>Aun no tienes movimientos recientes.</Text>
          </AppCard>
        ) : (
          <FlatList
            data={recentTransactions}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <AppCard>
                <Text style={styles.txTitle}>{item.service}</Text>
                <Text style={styles.txMeta}>{item.clientName || "Cliente"}</Text>
                <Text style={styles.txAmount}>+{Number(item.amount).toFixed(2)} cr</Text>
              </AppCard>
            )}
          />
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 28,
    fontWeight: "700",
  },
  onlineWrap: {
    alignItems: "center",
    gap: 4,
  },
  onlineLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "600",
  },
  loading: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  earningsLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  earningsValue: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
    fontSize: 30,
    fontWeight: "700",
  },
  earningsHint: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickActions: {
    gap: 8,
  },
  quickAction: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.surface,
    padding: 14,
    gap: 4,
  },
  quickTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  quickMeta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  txTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
    fontSize: 14,
  },
  txMeta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  txAmount: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 15,
  },
});
