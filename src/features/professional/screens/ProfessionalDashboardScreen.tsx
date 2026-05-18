import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getProfessionalDashboardSnapshot, updateMyProfessionalProfile } from "../api/professionalApi";
import { getProfessionalBookings, type ProfessionalBooking } from "../../../api/sessionOfferings";
import { formatBob, formatUsd } from "../../../utils/money";

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatMoney(value: number, currency: "BOB" | "USD" = "BOB") {
  return currency === "USD" ? formatUsd(value) : formatBob(value);
}

function formatBookingDate(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ProfessionalDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [bookings, setBookings] = useState<ProfessionalBooking[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, []),
  );

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const [data, bookingRows] = await Promise.all([
        getProfessionalDashboardSnapshot(),
        getProfessionalBookings().catch(() => [] as ProfessionalBooking[]),
      ]);
      setProfile(data.profile);
      setSummary(data.summary);
      setEarnings(data.earnings);
      setChats(Array.isArray(data.chats) ? data.chats : []);
      setBookings(Array.isArray(bookingRows) ? bookingRows : []);
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

  const bobBalance = Number(
    earnings?.withdrawableBalance ?? earnings?.realBalance ?? summary?.totalBalance ?? earnings?.total ?? 0,
  );
  const usdBalance = Number(earnings?.balanceUsd ?? 0);

  const confirmedToday = useMemo(() => {
    const now = new Date();
    return bookings.filter((item) => {
      const d = new Date(item.scheduledStartAt);
      if (Number.isNaN(d.getTime())) return false;
      return isSameDay(d, now) && item.status === "CONFIRMED";
    }).length;
  }, [bookings]);

  const pendingBookings = useMemo(
    () => bookings.filter((item) => item.status === "PENDING_PAYMENT").length,
    [bookings],
  );

  const messagesCount = Number(summary?.unreadChats ?? chats.length ?? 0);

  const nextBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((item) => {
        const start = new Date(item.scheduledStartAt);
        return !Number.isNaN(start.getTime()) && start >= now && item.status !== "EXPIRED";
      })
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
      .slice(0, 3);
  }, [bookings]);

  const statCards = [
    {
      id: "today",
      icon: "calendar-outline" as const,
      iconBg: "#EAF0FF",
      iconColor: "#5B7FCB",
      value: confirmedToday,
      label: "Confirmadas\nhoy",
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
      id: "pending",
      icon: "hourglass-outline" as const,
      iconBg: "#FFF7E6",
      iconColor: "#D6A700",
      value: pendingBookings,
      label: "Pendientes\nde pago",
    },
  ];

  return (
    <AppScreen scroll contentPadding={0}>
      <View style={styles.page}>
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              <Ionicons name="person" size={20} color="#94A3B8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeText}>Bienvenida,</Text>
              <Text style={styles.nameText}>{displayName}</Text>
            </View>
          </View>

          <View style={styles.statusWrap}>
            <Text style={styles.statusLabel}>{profile?.isOnline ? "Disponible" : "No disponible"}</Text>
            <Switch
              value={Boolean(profile?.isOnline)}
              onValueChange={handleToggleOnline}
              disabled={updatingStatus}
              trackColor={{ false: "#CFD8E5", true: "#85D3A2" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Text style={styles.availabilityHint}>Mostrarme como disponible para clientes</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <Text style={styles.loading}>Cargando dashboard...</Text> : null}

        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Saldo disponible (BOB)</Text>
          <Text style={styles.earningsValue}>{formatMoney(bobBalance, "BOB")}</Text>
          <Text style={styles.earningsHint}>Cartera USD: {formatMoney(usdBalance, "USD")}</Text>

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

          <Pressable style={styles.quickCard} onPress={() => router.push("/(professional)/sessions") as any}>
            <View style={[styles.quickIconWrap, { backgroundColor: "#EAF7EE" }]}>
              <Ionicons name="albums" size={18} color="#69AF8A" />
            </View>
            <Text style={[styles.quickText, { color: "#69AF8A" }]}>Mis sesiones</Text>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={() => router.push("/(professional)/availability" as any)}>
            <View style={[styles.quickIconWrap, { backgroundColor: "#F3ECFF" }]}>
              <Ionicons name="time" size={18} color="#A383D0" />
            </View>
            <Text style={[styles.quickText, { color: "#9D86CD" }]}>Disponibilidad</Text>
          </Pressable>

          <Pressable style={styles.quickCard} onPress={() => router.push("/(professional)/bookings") as any}>
            <View style={[styles.quickIconWrap, { backgroundColor: "#FFF1E7" }]}>
              <Ionicons name="calendar" size={18} color="#DD9A5B" />
            </View>
            <Text style={[styles.quickText, { color: "#E19664" }]}>Agenda</Text>
          </Pressable>
        </View>

        <Pressable style={styles.referralsCard} onPress={() => router.push("/(professional)/referrals" as any)}>
          <View style={styles.referralsIconWrap}>
            <Ionicons name="gift-outline" size={20} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.referralsTitle}>Mis referidos</Text>
            <Text style={styles.referralsSubtitle}>Comparte tu código y gana recompensas</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </Pressable>

        <Text style={styles.sectionTitle}>Proximas reservas</Text>

        {nextBookings.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyText}>Aun no tienes reservas proximas.</Text>
          </AppCard>
        ) : (
          <View style={styles.sessionsList}>
            {nextBookings.map((booking) => (
              <AppCard key={booking.id} style={styles.sessionCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionName}>{booking.sessionOffering?.title ?? "Reserva"}</Text>
                  <Text style={styles.sessionMeta}>
                    Cliente: {`${booking.client?.firstName ?? ""} ${booking.client?.lastName ?? ""}`.trim() || "Cliente"}
                  </Text>
                  <Text style={styles.sessionMeta}>{formatBookingDate(booking.scheduledStartAt)}</Text>
                </View>

                <Pressable style={styles.joinBtn} onPress={() => router.push("/(professional)/bookings" as any)}>
                  <Text style={styles.joinText}>Ver agenda</Text>
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
    alignItems: "center",
    justifyContent: "center",
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
  availabilityHint: {
    color: "#6B819C",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
    marginTop: -2,
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
  referralsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#F8FAFF",
    minHeight: 76,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  referralsIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0ECFF",
  },
  referralsTitle: {
    color: "#1E3A8A",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  referralsSubtitle: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    marginTop: 2,
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
