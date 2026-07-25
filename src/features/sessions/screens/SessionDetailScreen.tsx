import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import {
  apiGetSessionById,
  apiGetSessionPaymentStatus,
  apiPaySessionQr,
  apiPaySessionStripe,
  apiGetSessionAccess,
  type Session,
  type SessionPaymentStatus,
} from "../../../api/sessions";
import { useAuth } from "../../../context/AuthContext";
import { useUserRegion } from "../../../hooks/useUserRegion";
import { formatBob, formatUsd } from "../../../utils/money";

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isBolivian, canDetermineRegion } = useUserRegion();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [session, setSession] = useState<Session | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<SessionPaymentStatus>({ status: "NONE", currency: null });
  const [qrData, setQrData] = useState<{ qrImage: string | null; qrId: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currency = canDetermineRegion ? (isBolivian ? "BOB" : "USD") : null;
  const canUseQr = canDetermineRegion && isBolivian;
  const canUseStripe = canDetermineRegion && !isBolivian;

  async function load() {
    if (!id) return;
    try {
      const [s, ps] = await Promise.all([
        apiGetSessionById(id),
        apiGetSessionPaymentStatus(id),
      ]);
      setSession(s);
      setPaymentStatus(ps);
    } catch {
      Alert.alert("Error", "No se pudo cargar la sesión.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  useEffect(() => {
    if (paymentStatus.status === "PENDING") {
      pollingRef.current = setInterval(async () => {
        if (!id) return;
        const ps = await apiGetSessionPaymentStatus(id);
        setPaymentStatus(ps);
        if (ps.status !== "PENDING") {
          clearInterval(pollingRef.current!);
        }
      }, 3000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [paymentStatus.status, id]);

  async function handlePayQr() {
    if (!canDetermineRegion) return;
    if (!id) return;
    try {
      setPaying(true);
      const data = await apiPaySessionQr(id);
      setQrData({ qrImage: data.qrImage, qrId: data.qrId, amount: data.amount });
      setPaymentStatus({ status: "PENDING", currency: "BOB" });
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "No se pudo generar el QR.");
    } finally {
      setPaying(false);
    }
  }

  async function handlePayStripe() {
    if (!canDetermineRegion) return;
    if (!id) return;
    try {
      setPaying(true);

      const { clientSecret, customerId } = await apiPaySessionStripe(id);

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "SanaMente",
        customerId,
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : undefined,
          email: user?.email ?? undefined,
        },
        appearance: { colors: { primary: appTheme.colors.primary } },
      });

      if (initError) {
        Alert.alert("Error al inicializar el pago", initError.message);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== "Canceled") {
          Alert.alert("Pago fallido", presentError.message);
        }
        return;
      }

      // Pago completado — el webhook de Stripe actualizará el SessionPayment
      // El polling detectará el cambio a APPROVED
      setPaymentStatus({ status: "PENDING", currency: "USD" });
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "No se pudo iniciar el pago.");
    } finally {
      setPaying(false);
    }
  }

  async function handleGoToChat() {
    if (!id) return;
    try {
      const access = await apiGetSessionAccess(id);
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
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message ?? "No se pudo acceder al chat.");
    }
  }

  if (loading || !session) {
    return <AppScreen><Text style={styles.muted}>Cargando...</Text></AppScreen>;
  }

  const price = !canDetermineRegion
    ? "Completa tu país y teléfono para continuar."
    : currency === "USD"
      ? formatUsd(session.priceInUsd, true)
      : formatBob(session.priceInBs);

  const isApproved = paymentStatus.status === "APPROVED";
  const isPending = paymentStatus.status === "PENDING";

  return (
    <AppScreen scroll contentPadding={0}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.title}>Detalle de sesión</Text>
        </View>

        <AppCard style={styles.infoCard}>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          {session.professional && (
            <Text style={styles.profName}>
              {session.professional.firstName} {session.professional.lastName}
            </Text>
          )}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={appTheme.colors.textMuted} />
              <Text style={styles.metaText}>{formatDuration(session.durationMinutes)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color={appTheme.colors.textMuted} />
              <Text style={styles.metaText}>{price}</Text>
            </View>
          </View>
        </AppCard>

        {isApproved && (
          <AppCard style={styles.approvedCard}>
            <Ionicons name="checkmark-circle" size={28} color={appTheme.colors.success} />
            <Text style={styles.approvedText}>Pago confirmado</Text>
            <Text style={styles.approvedSub}>Ya puedes chatear, llamar o videollamar con el psicólogo.</Text>
            <Pressable style={styles.enterBtn} onPress={() => void handleGoToChat()}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
              <Text style={styles.enterBtnText}>Ir al chat</Text>
            </Pressable>
          </AppCard>
        )}

        {isPending && qrData && (
          <AppCard style={styles.qrCard}>
            <Text style={styles.qrTitle}>Escanea el QR para pagar</Text>
            <Text style={styles.qrAmount}>{formatBob(qrData.amount)}</Text>
            {qrData.qrImage ? (
              <Image source={{ uri: `data:image/png;base64,${qrData.qrImage}` }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={48} color={appTheme.colors.textMuted} />
              </View>
            )}
            <View style={styles.pendingRow}>
              <Ionicons name="time-outline" size={14} color={appTheme.colors.textMuted} />
              <Text style={styles.muted}>Esperando confirmacion de pago...</Text>
            </View>
          </AppCard>
        )}

        {isPending && !qrData && (
          <AppCard style={styles.approvedCard}>
            <Ionicons name="time-outline" size={28} color={appTheme.colors.primary} />
            <Text style={styles.approvedText}>Procesando pago...</Text>
            <Text style={styles.approvedSub}>Estamos confirmando tu pago con Stripe.</Text>
          </AppCard>
        )}

        {!isApproved && !isPending && (
          <AppCard style={styles.payCard}>
            <Text style={styles.payTitle}>Selecciona tu metodo de pago</Text>

            {canUseQr && (
              <Pressable
                style={[styles.payBtn, paying && styles.disabledBtn]}
                disabled={paying}
                onPress={() => void handlePayQr()}
              >
                <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
                <Text style={styles.payBtnText}>{paying ? "Generando QR..." : "Pagar con QR Baneco"}</Text>
              </Pressable>
            )}

            {canUseStripe && (
              <Pressable
                style={[styles.payBtnStripe, paying && styles.disabledBtn]}
                disabled={paying}
                onPress={() => void handlePayStripe()}
              >
                <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                <Text style={styles.payBtnText}>{paying ? "Procesando..." : "Pagar con tarjeta"}</Text>
              </Pressable>
            )}

            {!canUseQr && !canUseStripe && (
              <Text style={styles.muted}>Completa tu país y teléfono para continuar.</Text>
            )}
          </AppCard>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 24, gap: 14 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#DEE6F1",
  },
  backBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  infoCard: { marginHorizontal: 14, gap: 8 },
  sessionTitle: { fontSize: 18, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  profName: { fontSize: 13, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted },
  metaRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted },
  approvedCard: { marginHorizontal: 14, alignItems: "center", gap: 10, paddingVertical: 20 },
  approvedText: { fontSize: 16, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.success },
  approvedSub: { fontSize: 12, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted, textAlign: "center" },
  enterBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: appTheme.colors.primary, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 4,
  },
  enterBtnText: { color: "#FFFFFF", fontFamily: appTheme.fonts.heading, fontSize: 14, fontWeight: "700" },
  qrCard: { marginHorizontal: 14, alignItems: "center", gap: 10 },
  qrTitle: { fontSize: 15, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  qrAmount: { fontSize: 22, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.primary },
  qrImage: { width: 220, height: 220, borderRadius: 12 },
  qrPlaceholder: {
    width: 220, height: 220, borderRadius: 12,
    backgroundColor: "#F5F7FA", alignItems: "center", justifyContent: "center",
  },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  payCard: { marginHorizontal: 14, gap: 12 },
  payTitle: { fontSize: 15, fontWeight: "700", fontFamily: appTheme.fonts.heading, color: appTheme.colors.text },
  payBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: appTheme.colors.primary, borderRadius: 12, paddingVertical: 14,
  },
  payBtnStripe: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#635BFF", borderRadius: 12, paddingVertical: 14,
  },
  payBtnText: { color: "#FFFFFF", fontFamily: appTheme.fonts.heading, fontSize: 14, fontWeight: "700" },
  disabledBtn: { opacity: 0.65 },
  muted: { fontSize: 12, fontFamily: appTheme.fonts.body, color: appTheme.colors.textMuted, textAlign: "center" },
});
