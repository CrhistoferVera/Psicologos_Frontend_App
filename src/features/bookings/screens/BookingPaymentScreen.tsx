import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import AppCard from '../../../components/ui/AppCard';
import AppScreen from '../../../components/ui/AppScreen';
import AppButton from '../../../components/ui/AppButton';
import { appTheme } from '../../../theme/appTheme';
import {
  getMyBooking,
  getBookingQrStatus,
  initBookingPayment,
  type Booking,
  type BookingPaymentInitResponse,
  type RefundRequestResult,
} from '../../../api/bookings';
import { RefundRequestBanner } from '../../bookings/components/RefundRequestBanner';
import { formatBob, formatMoneyByCurrency, formatUsd } from '../../../utils/money';
import { safeBack } from '../../../utils/navigation';
import { pendingPaymentStore } from '../stores/pendingPaymentStore';

function normalizeStatus(status: string) {
  if (status === 'PENDING_PAYMENT') return 'Pendiente de pago';
  if (status === 'CONFIRMED') return 'Confirmada';
  if (status === 'EXPIRED') return 'Expirada';
  if (status.startsWith('CANCELLED')) return 'Cancelada';
  if (status === 'COMPLETED') return 'Completada';
  if (status === 'NO_SHOW') return 'No asistida';
  return status;
}

function statusColor(status: string) {
  if (status === 'CONFIRMED') return appTheme.colors.success;
  if (status === 'PENDING_PAYMENT') return appTheme.colors.primary;
  if (status === 'EXPIRED') return appTheme.colors.danger;
  if (status.startsWith('CANCELLED')) return '#991B1B';
  return appTheme.colors.textMuted;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} | ${time}`;
}

function formatCountdown(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function BookingPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string | string[];
    bookingIds?: string | string[];
    professionalName?: string | string[];
  }>();

  const rawBookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId ?? '';
  const rawBookingIds = Array.isArray(params.bookingIds) ? params.bookingIds[0] : params.bookingIds ?? '';
  const professionalName = Array.isArray(params.professionalName)
    ? params.professionalName[0]
    : params.professionalName ?? '';

  let bookingIdList: string[];
  if (rawBookingIds) {
    bookingIdList = rawBookingIds.split(',').filter(Boolean);
  } else if (rawBookingId) {
    bookingIdList = [rawBookingId];
  } else {
    bookingIdList = [];
  }

  const primaryBookingId = bookingIdList[0] ?? '';

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundDone, setRefundDone] = useState(false);
  const [initiating, setInitiating] = useState(false);  // generando QR / creando Stripe intent
  const [paying, setPaying] = useState(false);           // sheet de Stripe abierto
  const [paymentData, setPaymentData] = useState<BookingPaymentInitResponse | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoInitTriggeredRef = useRef(false);
  const expiryNoticeShownRef = useRef(false);

  // Booking primario (el que está PENDING_PAYMENT)
  const pendingBooking = bookings.find((b) => b.status === 'PENDING_PAYMENT') ?? null;
  const primaryBooking = pendingBooking ?? bookings[0] ?? null;
  const allConfirmed = bookings.length > 0 && bookings.every((b) => b.status === 'CONFIRMED');

  const bookingExpiresAtMs = pendingBooking?.expiresAt
    ? new Date(pendingBooking.expiresAt).getTime()
    : null;
  const hasValidExpiry = bookingExpiresAtMs !== null && Number.isFinite(bookingExpiresAtMs);
  const remainingMs = hasValidExpiry ? Math.max(0, bookingExpiresAtMs! - nowMs) : null;
  const isExpiredLocally = Boolean(pendingBooking && hasValidExpiry && remainingMs === 0);

  // Total de TODAS las sesiones pendientes
  const allPendingBookings = bookings.filter((b) => b.status === 'PENDING_PAYMENT');
  const totalFullPrice = allPendingBookings.reduce((sum, b) =>
    sum + (pendingBooking?.currency === 'USD' ? b.priceUsd : b.priceBob), 0);

  // Aporte del wallet = precio total de todas las pendientes - monto externo total (QR o Stripe)
  const walletContribution = (() => {
    if (!pendingBooking || !paymentData) return null;
    const contrib = Math.round((totalFullPrice - paymentData.amount) * 100) / 100;
    return contrib > 0.001 ? contrib : null;
  })();

  async function loadBookings(options?: { silent?: boolean }) {
    if (bookingIdList.length === 0) return;
    try {
      const results = await Promise.all(bookingIdList.map((id) => getMyBooking(id)));
      setBookings(results.filter(Boolean) as Booking[]);
    } catch (error) {
      if (!options?.silent) throw error;
    }
  }

  // Carga inicial: consume el store si el QR ya fue generado en la pantalla anterior
  useEffect(() => {
    if (bookingIdList.length === 0) return;
    void (async () => {
      try {
        setLoading(true);

        // Si el schedule screen ya llamó initBookingPayment, usar ese resultado al instante
        const preloaded = pendingPaymentStore.consume(primaryBookingId);
        if (preloaded) {
          setPaymentData(preloaded);
          autoInitTriggeredRef.current = true; // no volver a llamar initBookingPayment
        }

        await loadBookings();
      } catch {
        Alert.alert('Error', 'No se pudo cargar la reserva.');
      } finally {
        setLoading(false);
      }
    })();
  }, [primaryBookingId]);

  // Ticker para countdown
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-iniciar pago cuando hay un booking pendiente
  useEffect(() => {
    if (
      !loading &&
      pendingBooking &&
      !paymentData &&
      !initiating &&
      !paying &&
      !isExpiredLocally &&
      !autoInitTriggeredRef.current
    ) {
      autoInitTriggeredRef.current = true;
      void handleInitPayment();
    }
  }, [loading, pendingBooking?.id, paymentData, initiating, paying, isExpiredLocally]);

  // Polling mientras hay pendiente
  useEffect(() => {
    if (!pendingBooking || isExpiredLocally) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
      return;
    }
    const qrId = paymentData?.paymentMethod === 'BANECO_QR' ? paymentData.providerReference : null;
    pollingRef.current = setInterval(async () => {
      if (qrId) {
        try {
          const qrStatus = await getBookingQrStatus(qrId);
          if (qrStatus.status === 'PAID') {
            await loadBookings({ silent: true });
            return;
          }
        } catch { /* silent */ }
      }
      void loadBookings({ silent: true });
    }, 4000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [pendingBooking?.id, isExpiredLocally, paymentData?.providerReference]);

  // Alerta de expiración
  useEffect(() => {
    if (!isExpiredLocally || pendingBooking?.status !== 'PENDING_PAYMENT') {
      expiryNoticeShownRef.current = false;
      return;
    }
    if (expiryNoticeShownRef.current) return;
    expiryNoticeShownRef.current = true;
    Alert.alert('Reserva expirada', 'La reserva expiró. Vuelve a seleccionar un horario.');
    void loadBookings({ silent: true });
  }, [pendingBooking?.status, isExpiredLocally]);

  async function openStripeSheet(data: BookingPaymentInitResponse) {
    if (!data.paymentIntentClientSecret) {
      Alert.alert('Error', 'No se recibió el client secret de Stripe.');
      return;
    }
    const sheetConfig: any = {
      merchantDisplayName: 'SanaMente',
      paymentIntentClientSecret: data.paymentIntentClientSecret,
      appearance: { colors: { primary: appTheme.colors.primary } },
    };
    if (data.customerId && data.ephemeralKey) {
      sheetConfig.customerId = data.customerId;
      sheetConfig.customerEphemeralKeySecret = data.ephemeralKey;
    }
    const { error: initError } = await initPaymentSheet(sheetConfig);
    if (initError) {
      Alert.alert('Error al inicializar pago', initError.message);
      return;
    }
    setInitiating(false);
    setPaying(true);
    const { error: presentError } = await presentPaymentSheet();
    setPaying(false);
    if (presentError) {
      if (presentError.code !== 'Canceled') {
        Alert.alert('Pago fallido', presentError.message);
      }
      return;
    }
    Alert.alert('Pago procesado', 'Estamos confirmando tu pago, espera un momento.');
    await loadBookings({ silent: true });
  }

  async function handleInitPayment() {
    if (!pendingBooking) return;
    if (isExpiredLocally) {
      Alert.alert('Reserva expirada', 'La reserva expiró. Vuelve a seleccionar un horario.');
      await loadBookings();
      return;
    }

    try {
      setInitiating(true);

      // Si ya tenemos el clientSecret de Stripe (precargado o de llamada anterior),
      // abrir el sheet directamente sin ir al backend de nuevo.
      if (paymentData?.paymentMethod === 'STRIPE' && paymentData.paymentIntentClientSecret) {
        await openStripeSheet(paymentData);
        return;
      }

      const allPendingIds = bookings
        .filter((b) => b.status === 'PENDING_PAYMENT')
        .map((b) => b.id);
      const data = await initBookingPayment(pendingBooking.id, allPendingIds);
      setPaymentData(data);

      if (data.paymentMethod === 'BANECO_QR') {
        return;
      }

      if (data.paymentMethod === 'STRIPE') {
        await openStripeSheet(data);
      }
    } catch (err: any) {
      autoInitTriggeredRef.current = false; // permitir reintentar
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo iniciar el pago.');
      await loadBookings({ silent: true });
    } finally {
      setInitiating(false);
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator color={appTheme.colors.primary} />
          <Text style={styles.muted}>Cargando reserva...</Text>
        </View>
      </AppScreen>
    );
  }

  if (bookings.length === 0) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <Text style={styles.muted}>No se encontró la reserva.</Text>
        </View>
      </AppScreen>
    );
  }

  const qrImage = paymentData?.paymentMethod === 'BANECO_QR' ? paymentData.qrImage : null;
  const isQr = paymentData?.paymentMethod === 'BANECO_QR';
  const isStripe = paymentData?.paymentMethod === 'STRIPE';

  // Índice de la sesión pendiente actual dentro del total de sesiones
  const totalSessions = bookings.length;
  const pendingIdx = pendingBooking ? bookings.findIndex((b) => b.id === pendingBooking.id) + 1 : 0;
  const isBatchPending = totalSessions > 1;

  const noShowBooking = bookings.find((b) => b.status === 'NO_SHOW') ?? null;
  const refundEligible =
    noShowBooking != null &&
    (noShowBooking.noShowType === 'PROFESSIONAL' || noShowBooking.noShowType === 'BOTH');

  const hasRefundAvailable =
    !refundDone &&
    refundEligible &&
    !!noShowBooking?.refundWindowExpiresAt &&
    new Date(noShowBooking.refundWindowExpiresAt) > new Date();

  const refundExpired =
    !refundDone &&
    refundEligible &&
    !!noShowBooking?.refundWindowExpiresAt &&
    new Date(noShowBooking.refundWindowExpiresAt) <= new Date();

  const headerTitle = allConfirmed
    ? bookings.length > 1 ? 'Reservas confirmadas' : 'Reserva confirmada'
    : noShowBooking ? 'Detalle de sesión'
    : 'Pago de reserva';

  return (
    <AppScreen scroll contentPadding={0}>
      <ScrollView contentContainerStyle={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => safeBack(router, '/(user)')}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{headerTitle}</Text>
            <Text style={styles.subtitle}>{professionalName || 'SanaMente'}</Text>
          </View>
        </View>

        {/* ── TODAS CONFIRMADAS ─────────────────────────────────────────── */}
        {allConfirmed && (
          <>
            <AppCard style={styles.confirmedCard}>
              <View style={styles.confirmedIconWrap}>
                <Ionicons name="checkmark-circle" size={44} color={appTheme.colors.success} />
              </View>
              <Text style={styles.confirmedTitle}>
                {bookings.length > 1
                  ? `${bookings.length} sesiones reservadas`
                  : '¡Reserva confirmada!'}
              </Text>
              <Text style={styles.muted}>
                Tu reserva está lista. El psicólogo ha sido notificado.
              </Text>
            </AppCard>

            {bookings.map((b, idx) => (
              <AppCard key={b.id}>
                {bookings.length > 1 && (
                  <View style={styles.sessionBadgeRow}>
                    <View style={styles.sessionBadge}>
                      <Text style={styles.sessionBadgeText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.sessionBadgeLabel}>Sesión {idx + 1}</Text>
                  </View>
                )}
                <Text style={styles.blockTitle}>{b.sessionOffering?.title ?? 'Sesión'}</Text>
                <Text style={styles.meta}>{formatDateTime(b.scheduledStartAt)}</Text>
                <Text style={styles.meta}>
                  Monto:{' '}
                  {formatMoneyByCurrency(
                    b.currency === 'USD' ? b.priceUsd : b.priceBob,
                    b.currency,
                    true,
                  )}
                </Text>
                <View style={styles.statusRow}>
                  <Ionicons name="checkmark-circle" size={14} color={appTheme.colors.success} />
                  <Text style={[styles.statusText, { color: appTheme.colors.success }]}>
                    {normalizeStatus(b.status)}
                  </Text>
                </View>
              </AppCard>
            ))}

            <AppButton
              title="Ver mis reservas"
              onPress={() => router.replace('/(user)/bookings' as any)}
            />
          </>
        )}

        {/* ── NO SHOW ───────────────────────────────────────────────────── */}
        {noShowBooking && (
          <>
            <AppCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                <Text style={[styles.blockTitle, { color: '#DC2626' }]}>Sesión no realizada</Text>
              </View>
              <Text style={styles.meta}>{noShowBooking.sessionOffering?.title ?? 'Sesión'}</Text>
              <Text style={styles.meta}>{formatDateTime(noShowBooking.scheduledStartAt)}</Text>
              <Text style={styles.meta}>
                {formatMoneyByCurrency(
                  noShowBooking.currency === 'USD' ? noShowBooking.priceUsd : noShowBooking.priceBob,
                  noShowBooking.currency,
                  true,
                )}
              </Text>
            </AppCard>

            {hasRefundAvailable && (
              <RefundRequestBanner
                bookingId={noShowBooking.id}
                scheduledStartAt={noShowBooking.scheduledStartAt}
                refundWindowExpiresAt={noShowBooking.refundWindowExpiresAt!}
                onSuccess={(_result: RefundRequestResult) => setRefundDone(true)}
              />
            )}

            {refundExpired && (
              <AppCard>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="time-outline" size={18} color="#92400E" />
                  <Text style={[styles.meta, { color: '#92400E', fontWeight: '700', flex: 1 }]}>
                    El tiempo para solicitar reembolso ha expirado.
                  </Text>
                </View>
              </AppCard>
            )}

            {refundDone && (
              <AppCard>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                  <Text style={[styles.meta, { color: '#15803D', fontWeight: '700', flex: 1 }]}>
                    Solicitud de reembolso enviada. Te avisaremos cuando se procese.
                  </Text>
                </View>
              </AppCard>
            )}
          </>
        )}

        {/* ── PENDIENTE DE PAGO ─────────────────────────────────────────── */}
        {!allConfirmed && pendingBooking && (
          <>
            {/* Resumen de la sesión */}
            <AppCard>
              {/* Indicador de sesión N de M */}
              {isBatchPending && (
                <View style={styles.sessionBadgeRow}>
                  <View style={styles.sessionBadge}>
                    <Text style={styles.sessionBadgeText}>{totalSessions}</Text>
                  </View>
                  <Text style={styles.sessionBadgeLabel}>
                    {totalSessions} sesiones en un solo pago
                  </Text>
                </View>
              )}

              <Text style={styles.blockTitle}>
                {pendingBooking.sessionOffering?.title ?? 'Sesión'}
              </Text>
              <Text style={styles.meta}>{formatDateTime(pendingBooking.scheduledStartAt)}</Text>

              {/* Desglose de pago */}
              <View style={styles.priceBreakdown}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    {isBatchPending
                      ? `Total (${allPendingBookings.length} sesiones)`
                      : 'Precio de la sesión'}
                  </Text>
                  <Text style={styles.priceValue}>
                    {pendingBooking.currency === 'USD'
                      ? formatUsd(totalFullPrice, true)
                      : formatBob(totalFullPrice)}
                  </Text>
                </View>

                {walletContribution !== null && (
                  <>
                    <View style={styles.priceRow}>
                      <View style={styles.priceLabelRow}>
                        <Ionicons name="wallet-outline" size={13} color={appTheme.colors.success} />
                        <Text style={[styles.priceLabel, { color: appTheme.colors.success }]}>
                          Saldo de tu billetera
                        </Text>
                      </View>
                      <Text style={[styles.priceValue, { color: appTheme.colors.success }]}>
                        {pendingBooking.currency === 'USD'
                          ? formatUsd(walletContribution, true)
                          : formatBob(walletContribution)}
                      </Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { fontWeight: '700' }]}>
                        {isQr ? 'A pagar por QR' : 'A pagar por tarjeta'}
                      </Text>
                      <Text style={[styles.priceValue, { color: appTheme.colors.primary, fontWeight: '700' }]}>
                        {pendingBooking.currency === 'USD'
                          ? formatUsd(paymentData!.amount, true)
                          : formatBob(paymentData!.amount)}
                      </Text>
                    </View>
                  </>
                )}

                {walletContribution === null && paymentData && (
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { fontWeight: '700' }]}>
                      {isQr ? 'A pagar por QR' : 'A pagar por tarjeta'}
                    </Text>
                    <Text style={[styles.priceValue, { color: appTheme.colors.primary, fontWeight: '700' }]}>
                      {pendingBooking.currency === 'USD'
                        ? formatUsd(paymentData.amount, true)
                        : formatBob(paymentData.amount)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.statusRow}>
                <Ionicons name="time-outline" size={14} color={appTheme.colors.primary} />
                <Text style={[styles.statusText, { color: appTheme.colors.primary }]}>
                  {normalizeStatus(pendingBooking.status)}
                </Text>
              </View>
            </AppCard>

            {/* Countdown */}
            {hasValidExpiry && remainingMs !== null && (
              <AppCard style={styles.countdownCard}>
                {isExpiredLocally ? (
                  <View style={styles.expiredRow}>
                    <Ionicons name="alert-circle" size={18} color={appTheme.colors.danger} />
                    <Text style={[styles.meta, { color: appTheme.colors.danger, marginTop: 0 }]}>
                      La reserva expiró. Vuelve a seleccionar un horario.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.countdownRow}>
                    <Ionicons name="hourglass-outline" size={16} color="#92400E" />
                    <Text style={styles.countdownText}>
                      Tiempo restante:{' '}
                      <Text style={styles.countdownTimer}>{formatCountdown(remainingMs)}</Text>
                    </Text>
                  </View>
                )}
              </AppCard>
            )}

            {/* QR */}
            {isQr && !isExpiredLocally && (
              <AppCard style={styles.qrCard}>
                <View style={styles.qrHeader}>
                  <Ionicons name="qr-code" size={20} color={appTheme.colors.primary} />
                  <Text style={styles.blockTitle}>Escanea el QR para pagar</Text>
                </View>
                {qrImage ? (
                  <Image
                    source={{ uri: `data:image/png;base64,${qrImage}` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <ActivityIndicator color={appTheme.colors.primary} />
                    <Text style={styles.muted}>Generando QR...</Text>
                  </View>
                )}
                <Text style={styles.qrRef}>
                  Ref: {paymentData?.providerReference ?? '—'}
                </Text>
                <View style={styles.qrHintRow}>
                  <Ionicons name="information-circle-outline" size={14} color={appTheme.colors.textMuted} />
                  <Text style={styles.qrHint}>
                    La reserva se confirma automáticamente al detectar tu pago en Banco Unión.
                  </Text>
                </View>
              </AppCard>
            )}

            {/* Stripe loading indicator */}
            {isStripe && paying && (
              <AppCard style={styles.center}>
                <ActivityIndicator color={appTheme.colors.primary} />
                <Text style={styles.muted}>Procesando pago con tarjeta...</Text>
              </AppCard>
            )}

            {/* Generando QR / Intent */}
            {initiating && !paymentData && (
              <AppCard style={styles.loadingCard}>
                <ActivityIndicator color={appTheme.colors.primary} />
                <Text style={styles.muted}>Preparando tu pago...</Text>
              </AppCard>
            )}

            {/* Botón de pago */}
            {!isExpiredLocally && !paying && (
              <AppButton
                title={
                  initiating
                    ? 'Preparando...'
                    : isQr
                    ? 'Regenerar QR'
                    : isStripe
                    ? 'Pagar con tarjeta'
                    : 'Iniciar pago'
                }
                onPress={() => {
                  autoInitTriggeredRef.current = true;
                  void handleInitPayment();
                }}
                loading={initiating}
                disabled={initiating || paying || isExpiredLocally}
              />
            )}

            {isExpiredLocally && (
              <AppButton
                title="Volver a seleccionar horario"
                onPress={() => safeBack(router, '/(user)')}
              />
            )}
          </>
        )}

        {/* Otros bookings del batch (los que ya están confirmados) */}
        {!allConfirmed && bookings.filter((b) => b.status === 'CONFIRMED').length > 0 && (
          <>
            <View style={styles.sectionLabel}>
              <Ionicons name="checkmark-circle" size={14} color={appTheme.colors.success} />
              <Text style={[styles.meta, { color: appTheme.colors.success, marginTop: 0 }]}>
                Sesiones ya confirmadas
              </Text>
            </View>
            {bookings
              .filter((b) => b.status === 'CONFIRMED')
              .map((b) => (
                <AppCard key={b.id} style={styles.confirmedSmallCard}>
                  <Text style={styles.blockTitle}>{b.sessionOffering?.title ?? 'Sesión'}</Text>
                  <Text style={styles.meta}>{formatDateTime(b.scheduledStartAt)}</Text>
                  <View style={styles.statusRow}>
                    <Ionicons name="checkmark-circle" size={13} color={appTheme.colors.success} />
                    <Text style={[styles.statusText, { color: appTheme.colors.success }]}>
                      Confirmada
                    </Text>
                  </View>
                </AppCard>
              ))}
          </>
        )}

      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: appTheme.colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
  },
  subtitle: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: '#475569',
    fontFamily: appTheme.fonts.body,
    marginTop: 4,
  },
  muted: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: appTheme.fonts.body,
  },

  // Desglose de precio
  priceBreakdown: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  priceLabel: {
    fontSize: 13,
    color: '#475569',
    fontFamily: appTheme.fonts.body,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  priceDivider: {
    height: 1,
    backgroundColor: appTheme.colors.border,
    marginVertical: 2,
  },

  // Countdown
  countdownCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownText: {
    fontSize: 13,
    color: '#92400E',
    fontFamily: appTheme.fonts.body,
  },
  countdownTimer: {
    fontWeight: '700',
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
  },
  expiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // QR
  qrCard: {
    alignItems: 'center',
    gap: 10,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  qrImage: {
    width: 230,
    height: 230,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  qrPlaceholder: {
    width: 230,
    height: 230,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  qrRef: {
    fontSize: 11,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  qrHintRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  qrHint: {
    flex: 1,
    fontSize: 12,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    lineHeight: 17,
  },

  // Loading card
  loadingCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },

  // Confirmadas
  confirmedCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  confirmedIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
    textAlign: 'center',
  },
  confirmedSmallCard: {
    borderLeftWidth: 3,
    borderLeftColor: appTheme.colors.success,
  },
  sessionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sessionBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: appTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: appTheme.fonts.body,
  },
  sessionBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
});
