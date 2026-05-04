import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { apiGetMySessions, apiStartSession, apiEndSession, apiCancelSession, type Session } from "../../../api/sessions";

function statusMeta(status: Session["status"]) {
  if (status === "OPEN") return { label: "ABIERTA", bg: "#DBEAFE", text: "#1E40AF" };
  if (status === "ACTIVE") return { label: "EN CURSO", bg: "#DCFCE7", text: "#166534" };
  if (status === "COMPLETED") return { label: "COMPLETADA", bg: "#F3F4F6", text: "#374151" };
  return { label: "CANCELADA", bg: "#FEE2E2", text: "#991B1B" };
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function ProfessionalSessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await apiGetMySessions();
      setSessions(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las sesiones.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleStart(id: string) {
    try {
      await apiStartSession(id);
      await load();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "No se pudo iniciar la sesion.");
    }
  }

  async function handleEnd(id: string) {
    Alert.alert("Terminar sesion", "¿Confirmas que deseas terminar esta sesion?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Terminar", style: "destructive", onPress: async () => {
        try {
          await apiEndSession(id);
          await load();
        } catch (err: any) {
          Alert.alert("Error", err?.response?.data?.message ?? "No se pudo terminar la sesion.");
        }
      }},
    ]);
  }

  async function handleCancel(id: string) {
    Alert.alert("Cancelar sesion", "¿Confirmas que deseas cancelar esta sesion?", [
      { text: "No", style: "cancel" },
      { text: "Cancelar sesion", style: "destructive", onPress: async () => {
        try {
          await apiCancelSession(id);
          await load();
        } catch (err: any) {
          Alert.alert("Error", err?.response?.data?.message ?? "No se pudo cancelar la sesion.");
        }
      }},
    ]);
  }

  return (
    <AppScreen scroll={false} contentPadding={0}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis sesiones</Text>
        <Pressable style={styles.createBtn} onPress={() => router.push("/(professional)/create-session" as any)}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Nueva</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        {loading ? (
          <Text style={styles.muted}>Cargando sesiones...</Text>
        ) : sessions.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={appTheme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Sin sesiones</Text>
            <Text style={styles.muted}>Crea tu primera sesion para que los clientes puedan reservar.</Text>
          </AppCard>
        ) : (
          sessions.map((session) => {
            const meta = statusMeta(session.status);
            return (
              <AppCard key={session.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{session.title}</Text>
                    <Text style={styles.cardSub}>
                      {formatDuration(session.durationMinutes)} · Bs {Number(session.priceInBs).toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.badgeText, { color: meta.text }]}>{meta.label}</Text>
                  </View>
                </View>

                {session.approvedCount !== undefined && (
                  <Text style={styles.muted}>{session.approvedCount} cliente(s) con pago aprobado</Text>
                )}

                <View style={styles.actions}>
                  {session.status === "OPEN" && (
                    <>
                      <Pressable style={styles.actionBtn} onPress={() => handleStart(session.id)}>
                        <Ionicons name="play-circle-outline" size={15} color={appTheme.colors.success} />
                        <Text style={[styles.actionText, { color: appTheme.colors.success }]}>Iniciar</Text>
                      </Pressable>
                      <Pressable style={styles.actionBtn} onPress={() => router.push(`/(professional)/create-session?edit=${session.id}` as any)}>
                        <Ionicons name="pencil-outline" size={15} color={appTheme.colors.primary} />
                        <Text style={[styles.actionText, { color: appTheme.colors.primary }]}>Editar</Text>
                      </Pressable>
                      <Pressable style={styles.actionBtn} onPress={() => handleCancel(session.id)}>
                        <Ionicons name="close-circle-outline" size={15} color={appTheme.colors.danger} />
                        <Text style={[styles.actionText, { color: appTheme.colors.danger }]}>Cancelar</Text>
                      </Pressable>
                    </>
                  )}
                  {session.status === "ACTIVE" && (
                    <>
                      <Pressable style={styles.actionBtn} onPress={() => router.push(`/session/${session.id}` as any)}>
                        <Ionicons name="enter-outline" size={15} color={appTheme.colors.primary} />
                        <Text style={[styles.actionText, { color: appTheme.colors.primary }]}>Entrar</Text>
                      </Pressable>
                      <Pressable style={styles.actionBtn} onPress={() => handleEnd(session.id)}>
                        <Ionicons name="stop-circle-outline" size={15} color={appTheme.colors.danger} />
                        <Text style={[styles.actionText, { color: appTheme.colors.danger }]}>Terminar</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </AppCard>
            );
          })
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#DEE6F1",
  },
  title: { fontSize: 22, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: appTheme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createBtnText: { color: "#FFFFFF", fontFamily: appTheme.fonts.heading, fontSize: 13, fontWeight: "700" },
  list: { padding: 14, gap: 12 },
  card: { gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  cardSub: { fontSize: 12, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted, marginTop: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700", fontFamily: appTheme.fonts.body },
  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { fontSize: 12, fontFamily: appTheme.fonts.body, fontWeight: "600" },
  muted: { fontSize: 12, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted },
  emptyCard: { alignItems: "center", gap: 8, paddingVertical: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
});
