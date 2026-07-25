import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Dimensions, FlatList, Image, RefreshControl,
  ScrollView, StyleSheet, Text, Pressable, View,
} from "react-native";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { apiGetOpenSessions, apiGetMyActiveSessions, apiGetSessionAccess, type Session } from "../../../api/sessions";
import { useAuth } from "../../../context/AuthContext";
import { useUserRegion } from "../../../hooks/useUserRegion";
import { formatBob, formatUsd } from "../../../utils/money";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TABS = ["available", "mine", "history"] as const;
const TAB_LABELS = { available: "Disponibles", mine: "Mis reservas", history: "Historial" };
type Tab = typeof TABS[number];

type MyReservation = Awaited<ReturnType<typeof apiGetMyActiveSessions>>[number];

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
}

function ProfAvatar({ avatarUrl, firstName }: { avatarUrl?: string | null; firstName?: string | null }) {
  return (
    <View style={styles.avatarWrap}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>{(firstName?.[0] ?? "P").toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

function Specialties({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.specialtiesRow}>
      {items.slice(0, 2).map((sp) => (
        <View key={sp} style={styles.specialtyChip}>
          <Text style={styles.specialtyChipText}>{sp}</Text>
        </View>
      ))}
      {items.length > 2 && <Text style={styles.moreSpecialties}>+{items.length - 2}</Text>}
    </View>
  );
}

export default function UserSessionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isBolivian, canDetermineRegion } = useUserRegion();
  const [tabIndex, setTabIndex] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myReservations, setMyReservations] = useState<MyReservation[]>([]);
  const [history, setHistory] = useState<MyReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pagerRef = useRef<FlatList>(null);

  const currency = canDetermineRegion ? (isBolivian ? "BOB" : "USD") : null;

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [allSessions, myPaid] = await Promise.all([
        apiGetOpenSessions(),
        apiGetMyActiveSessions().catch(() => []),
      ]);
      const paidIds = new Set(myPaid.map((r) => r.sessionId));
      setSessions(allSessions.filter((s) => !paidIds.has(s.id)));
      setMyReservations(myPaid.filter((r) => r.sessionStatus === "OPEN" || r.sessionStatus === "ACTIVE"));
      setHistory(myPaid.filter((r) => r.sessionStatus === "COMPLETED" || r.sessionStatus === "CANCELLED"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function goToTab(index: number) {
    setTabIndex(index);
    pagerRef.current?.scrollToIndex({ index, animated: true });
  }

  async function handleGoToChat(sessionId: string) {
    try {
      const access = await apiGetSessionAccess(sessionId);
      router.push({
        pathname: "/(user)/chats/[id]",
        params: {
          id: access.conversationId,
          professionalId: access.professionalId,
          professionalName: access.professionalName,
          professionalAvatar: access.professionalAvatar ?? "",
          hasActiveSession: "true",
        },
      } as any);
    } catch {
      router.push(`/(user)/sessions/${sessionId}` as any);
    }
  }

  const price = (session: Session) => {
    if (!canDetermineRegion) return "Completa tu país y teléfono para continuar.";
    return currency === "USD" ? formatUsd(session.priceInUsd) : formatBob(session.priceInBs);
  };
  const currencyLabel = currency ?? "N/A";

  const badges: Record<Tab, number> = {
    available: sessions.length,
    mine: myReservations.length,
    history: history.length,
  };

  // ── Contenido de cada página ──────────────────────────────────────────────

  function renderAvailable() {
    if (loading) return (
      <View style={styles.stateWrap}><Text style={styles.muted}>Cargando...</Text></View>
    );
    if (sessions.length === 0) return (
      <View style={styles.stateWrap}>
        <Ionicons name="calendar-outline" size={40} color={appTheme.colors.textMuted} />
        <Text style={styles.emptyTitle}>Sin sesiones disponibles</Text>
        <Text style={styles.muted}>Vuelve pronto, los psicólogos publicarán nuevas sesiones.</Text>
      </View>
    );
    return (
      <>
        {sessions.map((session) => {
          const isActive = session.status === "ACTIVE";
          return (
            <Pressable
              key={session.id}
              style={styles.card}
              onPress={() => router.push(`/(user)/sessions/${session.id}` as any)}
            >
              {isActive && (
                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activePillText}>En curso</Text>
                </View>
              )}
              <View style={styles.profRow}>
                <ProfAvatar avatarUrl={session.professional?.avatarUrl} firstName={session.professional?.firstName} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.profName}>{session.professional?.firstName} {session.professional?.lastName}</Text>
                  <Specialties items={session.professional?.specialties} />
                </View>
              </View>
              <View style={styles.divider} />
              <Text style={styles.sessionTitle}>{session.title}</Text>
              {session.professional?.bio ? <Text style={styles.bio} numberOfLines={2}>{session.professional.bio}</Text> : null}
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons name="time-outline" size={13} color={appTheme.colors.primary} />
                  <Text style={styles.metaChipText}>{formatDuration(session.durationMinutes)}</Text>
                </View>
                <View style={[styles.metaChip, styles.priceChip]}>
                  <Text style={styles.priceText}>{price(session)}</Text>
                  <Text style={styles.currencyText}>{currencyLabel}</Text>
                </View>
              </View>
              <View style={[styles.cta, isActive && styles.ctaActive]}>
                <Text style={[styles.ctaText, isActive && styles.ctaTextActive]}>
                  {isActive ? "Unirse ahora" : "Reservar sesión"}
                </Text>
                <Ionicons name={isActive ? "flash" : "arrow-forward"} size={14} color={isActive ? "#FFFFFF" : appTheme.colors.primary} />
              </View>
            </Pressable>
          );
        })}
      </>
    );
  }

  function renderMine() {
    if (loading) return (
      <View style={styles.stateWrap}><Text style={styles.muted}>Cargando...</Text></View>
    );
    if (myReservations.length === 0) return (
      <View style={styles.stateWrap}>
        <Ionicons name="receipt-outline" size={40} color={appTheme.colors.textMuted} />
        <Text style={styles.emptyTitle}>Sin reservas aún</Text>
        <Text style={styles.muted}>Cuando pagues una sesión aparecerá aquí.</Text>
        <Pressable style={styles.goAvailableBtn} onPress={() => goToTab(0)}>
          <Text style={styles.goAvailableBtnText}>Ver sesiones disponibles</Text>
        </Pressable>
      </View>
    );
    return (
      <>
        {myReservations.map((r) => {
          const isActive = r.sessionStatus === "ACTIVE";
          const priceLabel = r.currency === "USD" ? formatUsd(r.amountPaid, true) : formatBob(r.amountPaid, true);
          return (
            <View key={r.sessionId} style={[styles.card, styles.reservedCard]}>
              <View style={styles.reservedTopRow}>
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#166534" />
                  <Text style={styles.paidBadgeText}>Pagado · {priceLabel}</Text>
                </View>
                {isActive && (
                  <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activePillText}>En curso</Text>
                  </View>
                )}
              </View>
              <View style={styles.profRow}>
                <ProfAvatar avatarUrl={r.professional.avatarUrl} firstName={r.professional.firstName} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.profName}>{r.professional.firstName} {r.professional.lastName}</Text>
                  <Specialties items={r.professional.specialties} />
                </View>
              </View>
              <View style={styles.divider} />
              <Text style={styles.sessionTitle}>{r.sessionTitle}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons name="time-outline" size={13} color={appTheme.colors.primary} />
                  <Text style={styles.metaChipText}>{formatDuration(r.durationMinutes)}</Text>
                </View>
              </View>
              <View style={styles.actionsRow}>
                <Pressable style={styles.chatBtn} onPress={() => void handleGoToChat(r.sessionId)}>
                  <Ionicons name="chatbubble-ellipses-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.chatBtnText}>Ir al chat</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </>
    );
  }

  function renderHistory() {
    if (loading) return (
      <View style={styles.stateWrap}><Text style={styles.muted}>Cargando...</Text></View>
    );
    if (history.length === 0) return (
      <View style={styles.stateWrap}>
        <Ionicons name="time-outline" size={40} color={appTheme.colors.textMuted} />
        <Text style={styles.emptyTitle}>Sin historial aún</Text>
        <Text style={styles.muted}>Aquí aparecerán tus sesiones completadas o canceladas.</Text>
      </View>
    );
    return (
      <>
        {history.map((r) => {
          const isCompleted = r.sessionStatus === "COMPLETED";
          const priceLabel = r.currency === "USD" ? formatUsd(r.amountPaid, true) : formatBob(r.amountPaid, true);
          return (
            <View key={r.sessionId} style={[styles.card, isCompleted ? styles.completedCard : styles.cancelledCard]}>
              <View style={styles.reservedTopRow}>
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#166534" />
                  <Text style={styles.paidBadgeText}>Pagado · {priceLabel}</Text>
                </View>
                {isCompleted ? (
                  <View style={styles.completedPill}><Text style={styles.completedPillText}>Completada</Text></View>
                ) : (
                  <View style={styles.cancelledPill}><Text style={styles.cancelledPillText}>Cancelada</Text></View>
                )}
              </View>
              <View style={styles.profRow}>
                <ProfAvatar avatarUrl={r.professional.avatarUrl} firstName={r.professional.firstName} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.profName}>{r.professional.firstName} {r.professional.lastName}</Text>
                  <Specialties items={r.professional.specialties} />
                </View>
              </View>
              <View style={styles.divider} />
              <Text style={styles.sessionTitle}>{r.sessionTitle}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons name="time-outline" size={13} color={appTheme.colors.primary} />
                  <Text style={styles.metaChipText}>{formatDuration(r.durationMinutes)}</Text>
                </View>
                {isCompleted && r.endedAt && (
                  <View style={[styles.metaChip, styles.dateChip]}>
                    <Ionicons name="calendar-outline" size={13} color="#374151" />
                    <Text style={styles.dateChipText}>Finalizada el {formatDate(r.endedAt)}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </>
    );
  }

  const pages = [renderAvailable, renderMine, renderHistory];

  return (
    <AppScreen scroll={false} contentPadding={0}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sesiones</Text>
        <Text style={styles.subtitle}>Conecta con un psicólogo</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBarScroll}
        contentContainerStyle={styles.tabBar}
      >
        {TABS.map((t, i) => (
          <Pressable
            key={t}
            style={[styles.tab, tabIndex === i && styles.tabActive]}
            onPress={() => goToTab(i)}
          >
            <Text style={[styles.tabText, tabIndex === i && styles.tabTextActive]}>
              {TAB_LABELS[t]}
            </Text>
            {badges[t] > 0 && (
              <View style={[styles.tabBadge, tabIndex === i && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, tabIndex === i && styles.tabBadgeTextActive]}>
                  {badges[t]}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Indicador de tab activo */}
      <View style={styles.tabIndicatorTrack}>
        <View style={[styles.tabIndicator, { width: `${100 / TABS.length}%`, left: `${(tabIndex * 100) / TABS.length}%` }]} />
      </View>

      {/* Pager con swipe */}
      <FlatList
        ref={pagerRef}
        data={pages}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setTabIndex(index);
        }}
        renderItem={({ item: renderPage }) => (
          <ScrollView
            style={{ width: SCREEN_WIDTH }}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
            showsVerticalScrollIndicator={false}
          >
            {renderPage()}
          </ScrollView>
        )}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#DEE6F1",
  },
  title: { fontSize: 26, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  subtitle: { fontSize: 13, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted, marginTop: 2 },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  tabBarScroll: {
    backgroundColor: "#FFFFFF",
  },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "#F1F5F9",
  },
  tabActive: { backgroundColor: appTheme.colors.primary },
  tabText: { fontSize: 13, fontWeight: "700", fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted },
  tabTextActive: { color: "#FFFFFF" },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.3)" },
  tabBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted },
  tabBadgeTextActive: { color: "#FFFFFF" },
  tabIndicatorTrack: {
    height: 2, backgroundColor: "#F1F5F9", position: "relative",
  },
  tabIndicator: {
    position: "absolute", height: 2,
    backgroundColor: appTheme.colors.primary,
    borderRadius: 999,
  },
  list: { padding: 14, gap: 14, paddingBottom: 24 },
  stateWrap: { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  goAvailableBtn: {
    marginTop: 4, backgroundColor: appTheme.colors.primary,
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
  },
  goAvailableBtnText: { color: "#FFFFFF", fontFamily: appTheme.fonts.heading, fontSize: 13, fontWeight: "700" },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, gap: 10,
    borderWidth: 1, borderColor: "#E8EEF6",
    shadowColor: "#1E3A5F", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  reservedCard: { borderLeftWidth: 3, borderLeftColor: appTheme.colors.success },
  completedCard: { borderLeftWidth: 3, borderLeftColor: "#6B7280" },
  cancelledCard: { borderLeftWidth: 3, borderLeftColor: appTheme.colors.danger },
  dateChip: { backgroundColor: "#F3F4F6" },
  dateChipText: { fontSize: 12, fontWeight: "600", fontFamily: appTheme.fonts.body, color: "#374151" },
  reservedTopRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  paidBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#DCFCE7", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  paidBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: appTheme.fonts.body, color: "#166534" },
  activePill: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
    backgroundColor: "#DCFCE7", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" },
  activePillText: { fontSize: 11, fontWeight: "700", fontFamily: appTheme.fonts.body, color: "#166534" },
  completedPill: { backgroundColor: "#F3F4F6", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  completedPillText: { fontSize: 10, fontWeight: "700", fontFamily: appTheme.fonts.body, color: "#374151" },
  cancelledPill: { backgroundColor: "#FEE2E2", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  cancelledPillText: { fontSize: 10, fontWeight: "700", fontFamily: appTheme.fonts.body, color: "#991B1B" },
  profRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#E2E8F0" },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: appTheme.colors.primary, alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { fontSize: 20, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: "#FFFFFF" },
  profName: { fontSize: 15, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  specialtiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  specialtyChip: { backgroundColor: "#EEF4FF", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  specialtyChipText: { fontSize: 10, fontWeight: "600", fontFamily: appTheme.fonts.body, color: appTheme.colors.primary },
  moreSpecialties: { fontSize: 10, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted, alignSelf: "center" },
  divider: { height: 1, backgroundColor: "#F0F4F8" },
  sessionTitle: { fontSize: 16, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  bio: { fontSize: 12, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted, lineHeight: 18 },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F0F4FF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  metaChipText: { fontSize: 12, fontWeight: "600", fontFamily: appTheme.fonts.body, color: appTheme.colors.primary },
  priceChip: { backgroundColor: "#F0FDF4", gap: 3 },
  priceText: { fontSize: 14, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: "#166534" },
  currencyText: { fontSize: 10, fontFamily: appTheme.fonts.body, color: "#166534", fontWeight: "600" },
  cta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1.5, borderColor: appTheme.colors.primary, borderRadius: 12,
    paddingVertical: 11, marginTop: 2,
  },
  ctaActive: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  ctaText: { fontSize: 13, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.primary },
  ctaTextActive: { color: "#FFFFFF" },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  chatBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: appTheme.colors.primary, borderRadius: 12, paddingVertical: 11,
  },
  chatBtnText: { color: "#FFFFFF", fontFamily: appTheme.fonts.heading, fontSize: 13, fontWeight: "700" },
  muted: { fontSize: 12, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted, textAlign: "center" },
});
