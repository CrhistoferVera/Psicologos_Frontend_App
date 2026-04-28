import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getProfessionalDashboardSnapshot, updateMyProfessionalProfile } from "../api/professionalApi";

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatClock(iso?: string) {
  if (!iso) return "11:00";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "11:00";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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
      setChats(Array.isArray(data.chats) ? data.chats : []);
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

  const displayName = useMemo(() => {
    const full = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
    return full || "Professional";
  }, [profile?.firstName, profile?.lastName]);

  const monthEarnings = Number(summary?.totalBalance ?? earnings?.total ?? 0);
  const monthlyGrowth = 18;

  const sessionsToday = useMemo(() => {
    const now = new Date();
    const tx = Array.isArray(earnings?.transactions) ? earnings.transactions : [];
    return tx.filter((item: any) => {
      const d = new Date(item.createdAt);
      if (Number.isNaN(d.getTime())) return false;
      return isSameDay(d, now);
    }).length;
  }, [earnings?.transactions]);

  const messagesCount = Number(summary?.unreadChats ?? chats.length ?? 0);
  const newItems = Number(summary?.totalTransactions ?? 0);

  const nextSessions = useMemo(() => {
    const list = Array.isArray(chats) ? chats.slice(0, 2) : [];
    return list.map((chat: any, index: number) => {
      const lower = String(chat?.lastMessage ?? "").toLowerCase();
      const type = lower.includes("video") ? "Video" : index % 2 === 0 ? "Video" : "Llamada";
      return {
        id: String(chat.conversationId),
        name: chat.otherUserName || "Cliente",
        avatar: chat.otherUserAvatar,
        time: formatClock(chat.lastMessageAt),
        type,
        clientId: chat.otherUserId,
      };
    });
  }, [chats]);

  const statCards = [
    {
      id: "sessions",
      icon: "calendar-outline" as const,
      iconBg: "#EAF0FF",
      iconColor: "#5B7FCB",
      value: sessionsToday,
      label: "Sesiones\nhoy",
    },
    {
      id: "messages",
      icon: "chatbubble-ellipses-outline" as const,
      iconBg: "#EEEAFE",
      iconColor: "#8D75C9",
      value: messagesCount,
      label: "Mensajes",
    },
    {
      id: "new",
      icon: "star" as const,
      iconBg: "#EAF7EE",
      iconColor: "#D6A700",
      value: newItems,
      label: "Nuevos",
    },
  ];

  return (
    <AppScreen scroll contentPadding={0}>
      <View style={styles.page}>
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <Image
              source={profile?.avatarUrl ? { uri: profile.avatarUrl } : require("../../../../assets/no_image.jpg")}
              style={styles.headerAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeText}>Bienvenida,</Text>
              <Text style={styles.nameText}>{displayName}</Text>
            </View>
          </View>

          <View style={styles.statusWrap}>
            <Text style={styles.statusLabel}>{profile?.isOnline ? "En línea" : "Offline"}</Text>
            <Switch
              value={Boolean(profile?.isOnline)}
              onValueChange={handleToggleOnline}
              disabled={updatingStatus}
              trackColor={{ false: "#CFD8E5", true: "#85D3A2" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <Text style={styles.loading}>Cargando dashboard...</Text> : null}

        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Ganancias del mes</Text>
          <Text style={styles.earningsValue}>{formatMoney(monthEarnings)}</Text>

          <Text style={styles.earningsHint}>
            vs mes anterior: <Text style={styles.earningsUp}>+{monthlyGrowth}%</Text>
          </Text>

          <View style={styles.earningsActions}>
            <Pressable style={styles.earningsBtnPrimary} onPress={() => router.push("/(professional)/earnings") as any}>
              <Text style={styles.earningsBtnPrimaryText}>Ver ganancias</Text>
            </Pressable>

            <Pressable style={styles.earningsBtnSuccess} onPress={() => router.push("/(professional)/earnings") as any}>
              <Text style={styles.earningsBtnSuccessText}>Solicitar retiro</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          {statCards.map((item) => (
            <AppCard key={item.id} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: item.iconBg }]}> 
                <Ionicons name={item.icon} size={18} color={item.iconColor} />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </AppCard>
          ))}
        </View>

        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={() => router.push("/(professional)/profile") as any}>
            <View style={[styles.quickIconWrap, { backgroundColor: "#EAF0FF" }]}>
              <Ionicons name="person" size={18} color="#6253A7" />
            </View>
            <Text style={[styles.quickText, { color: "#4E86CF" }]}>Editar perfil</Text>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={() => router.push("/(professional)/earnings") as any}>
            <View style={[styles.quickIconWrap, { backgroundColor: "#EAF7EE" }]}>
              <Ionicons name="bar-chart" size={18} color="#69AF8A" />
            </View>
            <Text style={[styles.quickText, { color: "#69AF8A" }]}>Ver ganancias</Text>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={() => router.push("/(professional)/referrals" as any)}>
            <View style={[styles.quickIconWrap, { backgroundColor: "#F3ECFF" }]}>
              <Ionicons name="gift" size={18} color="#A383D0" />
            </View>
            <Text style={[styles.quickText, { color: "#9D86CD" }]}>Mis referidos</Text>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={() => router.push("/(professional)/earnings") as any}>
            <View style={[styles.quickIconWrap, { backgroundColor: "#FFF1E7" }]}>
              <Ionicons name="cash" size={18} color="#DD9A5B" />
            </View>
            <Text style={[styles.quickText, { color: "#E19664" }]}>Retirar saldo</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Próximas sesiones</Text>

        {nextSessions.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyText}>Aún no tienes sesiones próximas.</Text>
          </AppCard>
        ) : (
          <View style={styles.sessionsList}>
            {nextSessions.map((session) => (
              <AppCard key={session.id} style={styles.sessionCard}>
                <Image
                  source={session.avatar ? { uri: session.avatar } : require("../../../../assets/no_image.jpg")}
                  style={styles.sessionAvatar}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionName}>{session.name}</Text>
                  <Text style={styles.sessionMeta}>{session.type} · {session.time}</Text>
                </View>

                <Pressable
                  style={styles.joinBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/(professional)/messages/[id]",
                      params: {
                        id: session.id,
                        clientId: session.clientId,
                        clientName: session.name,
                        clientAvatar: session.avatar ?? "",
                      },
                    } as any)
                  }
                >
                  <Text style={styles.joinText}>Unirse</Text>
                </Pressable>
              </AppCard>
            ))}
          </View>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: appTheme.colors.background,
  },
  headerCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  welcomeText: {
    color: "#6D84A0",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  nameText: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 28,
  },
  statusWrap: {
    alignItems: "center",
    gap: 6,
  },
  statusLabel: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
    fontSize: 14,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
  },
  loading: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
  },
  earningsCard: {
    borderRadius: 22,
    backgroundColor: "#3F638F",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 10,
  },
  earningsLabel: {
    color: "#D9E8F7",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  earningsValue: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 42,
  },
  earningsHint: {
    color: "#D3E4F8",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  earningsUp: {
    color: "#7DDB9D",
    fontWeight: "700",
  },
  earningsActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  earningsBtnPrimary: {
    flex: 1,
    minHeight: 38,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  earningsBtnPrimaryText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  earningsBtnSuccess: {
    flex: 1,
    minHeight: 38,
    borderRadius: 18,
    backgroundColor: "#69B98A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  earningsBtnSuccessText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    minHeight: 108,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "700",
  },
  statLabel: {
    color: "#6B819C",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickCard: {
    width: "48.5%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickText: {
    flex: 1,
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#5F7896",
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  sessionsList: {
    gap: 10,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sessionAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E2E8F0",
  },
  sessionName: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  sessionMeta: {
    color: "#6B819C",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    marginTop: 2,
  },
  joinBtn: {
    borderRadius: 12,
    backgroundColor: "#E7F1FB",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  joinText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    textAlign: "center",
  },
});


