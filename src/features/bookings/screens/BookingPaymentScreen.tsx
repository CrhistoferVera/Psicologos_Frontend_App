import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import AppCard from '../../../components/ui/AppCard';
import AppScreen from '../../../components/ui/AppScreen';
import AppButton from '../../../components/ui/AppButton';
import { appTheme } from '../../../theme/appTheme';
import {
  getMyBooking,
  initBookingPayment,
  type Booking,
  type BookingPaymentInitResponse,
} from '../../../api/bookings';
import { formatBob, formatMoneyByCurrency } from '../../../utils/money';

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

function formatRemainingMs(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function BookingPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string | string[]; professionalName?: string | string[] }>();
  const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId ?? '';
  const professionalName = Array.isArray(params.professionalName)
    ? params.professionalName[0]
    : params.professionalName ?? '';

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentData, setPaymentData] = useState<BookingPaymentInitResponse | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryNoticeShownRef = useRef(false);

  async function loadBooking(options?: { silent?: boolean }) {
    if (!bookingId) return;
    try {
      const found = await getMyBooking(bookingId);
      setBooking(found ?? null);
    } catch (error) {
      if (!options?.silent) throw error;
    }
  }

  useEffect(() => {
    if (!bookingId) return;

    void (async () => {
      try {
        setLoading(true);
        await loadBooking();
      } catch {
        Alert.alert('Error', 'No se pudo cargar la reserva.');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isPending = booking?.status === 'PENDING_PAYMENT';
  const isConfirmed = booking?.status === 'CONFIRMED';
  const bookingExpiresAtMs = booking?.expiresAt ? new Date(booking.expiresAt).getTime() : null;
  const hasValidExpiry = bookingExpiresAtMs !== null && Number.isFinite(bookingExpiresAtMs);
  const remainingMs = hasValidExpiry ? Math.max(0, bookingExpiresAtMs - nowMs) : null;
  const isExpiredLocally = Boolean(isPending && hasValidExpiry && remainingMs === 0);

  useEffect(() => {
    if (!isExpiredLocally || booking?.status !== 'PENDING_PAYMENT') {
      expiryNoticeShownRef.current = false;
      return;
    }

    if (expiryNoticeShownRef.current) return;
    expiryNoticeShownRef.current = true;
    Alert.alert('Reserva expirada', 'La reserva expiró. Vuelve a seleccionar un horario.');
    void loadBooking({ silent: true });
  }, [booking?.status, isExpiredLocally]);

  useEffect(() => {
    const status = booking?.status;
    if (status !== 'PENDING_PAYMENT' || isExpiredLocally) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
      return;
    }

    pollingRef.current = setInterval(() => {
      void loadBooking({ silent: true });
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [booking?.status, isExpiredLocally]);

  const amountLabel = useMemo(() => {
    if (!booking) return '';
    const amount = booking.currency === 'USD' ? booking.priceUsd : booking.priceBob;
    return formatMoneyByCurrency(amount, booking.currency, true);
  }, [booking]);

  async function handleInitPayment() {
    if (!booking) return;
    if (isExpiredLocally) {
      Alert.alert('Reserva expirada', 'La reserva expiró. Vuelve a seleccionar un horario.');
      await loadBooking();
      return;
    }
    if (booking.status !== 'PENDING_PAYMENT') return;

    try {
      setPaying(true);
      const data = await initBookingPayment(booking.id);
      setPaymentData(data);

      if (data.paymentMethod === 'BANECO_QR') {
        await loadBooking();
        return;
      }

      if (data.paymentMethod === 'STRIPE') {
        if (!data.paymentIntentClientSecret) {
          Alert.alert('Error', 'No se recibio el client secret de Stripe.');
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

        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          if (presentError.code !== 'Canceled') {
            Alert.alert('Pago fallido', presentError.message);
          }
          return;
        }

        Alert.alert('Pago procesado', 'Estamos confirmando tu pago.');
        await loadBooking();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo iniciar el pago.');
      await loadBooking();
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.center}><Text style={styles.muted}>Cargando reserva...</Text></View>
      </AppScreen>
    );
  }

  if (!booking) {
    return (
      <AppScreen>
        <View style={styles.center}><Text style={styles.muted}>No se encontro la reserva.</Text></View>
      </AppScreen>
    );
  }

  const qrImage = paymentData?.paymentMethod === 'BANECO_QR' ? paymentData.qrImage : null;

  return (
    <AppScreen scroll contentPadding={0}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{isConfirmed ? 'Reserva confirmada' : 'Pago de reserva'}</Text>
            <Text style={styles.subtitle}>{professionalName || 'SanaMente'}</Text>
          </View>
        </View>

        <AppCard>
          <Text style={styles.blockTitle}>{booking.sessionOffering?.title ?? 'Sesión'}</Text>
          <Text style={styles.meta}>{formatDateTime(booking.scheduledStartAt)}</Text>
          <Text style={styles.meta}>Monto: {amountLabel}</Text>
          <View style={styles.statusWrap}>
            <Text style={[styles.statusText, { color: statusColor(booking.status) }]}>
              {normalizeStatus(booking.status)}
            </Text>
          </View>
        </AppCard>

        {isPending && (
          <AppCard>
            {hasValidExpiry && remainingMs !== null ? (
              isExpiredLocally ? (
                <>
                  <Text style={[styles.meta, { color: appTheme.colors.danger, marginTop: 0 }]}>
                    La reserva expiró. Vuelve a seleccionar un horario.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.meta, { marginTop: 0 }]}>
                    Tu reserva expira en {formatRemainingMs(remainingMs)} minutos.
                  </Text>
                  <Text style={styles.meta}>Tienes 15 minutos para completar el pago.</Text>
                </>
              )
            ) : (
              <Text style={[styles.meta, { marginTop: 0 }]}>
                Esta reserva está pendiente de pago. El tiempo de expiración no está disponible.
              </Text>
            )}
          </AppCard>
        )}

        {isConfirmed && (
          <AppCard style={styles.confirmedCard}>
            <Ionicons name="checkmark-circle" size={30} color={appTheme.colors.success} />
            <Text style={styles.confirmedTitle}>Reserva confirmada</Text>
            <Text style={styles.muted}>El saldo fue descontado de tu billetera correctamente.</Text>
          </AppCard>
        )}

        {isConfirmed && (
          <AppButton
            title="Ver mis reservas"
            onPress={() => router.replace('/(user)/bookings' as any)}
          />
        )}

        {isPending && paymentData?.paymentMethod === 'BANECO_QR' && (
          <AppCard style={styles.qrCard}>
            <Text style={styles.blockTitle}>Escanea el QR para pagar</Text>
            <Text style={styles.meta}>Monto: {formatBob(paymentData.amount, true)}</Text>
            {qrImage ? (
              <Image source={{ uri: `data:image/png;base64,${qrImage}` }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={48} color={appTheme.colors.textMuted} />
              </View>
            )}
            <Text style={styles.meta}>Referencia: {paymentData.providerReference ?? '-'}</Text>
            <Text style={styles.muted}>La reserva se confirmará cuando Baneco confirme el pago.</Text>
          </AppCard>
        )}

        {isPending && (
          <AppButton
            title={
              isExpiredLocally
                ? 'Reserva expirada'
                : paying
                ? 'Procesando...'
                : paymentData
                ? 'Reintentar pago'
                : 'Iniciar pago'
            }
            onPress={() => void handleInitPayment()}
            loading={paying}
            disabled={paying || isExpiredLocally}
          />
        )}

        {!isPending && !isConfirmed && (
          <AppCard>
            <Text style={styles.muted}>
              Esta reserva no puede pagarse en su estado actual ({normalizeStatus(booking.status)}).
            </Text>
          </AppCard>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: appTheme.colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  statusWrap: {
    marginTop: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: appTheme.fonts.body,
  },
  meta: {
    fontSize: 13,
    color: '#475569',
    fontFamily: appTheme.fonts.body,
    marginTop: 4,
  },
  qrCard: {
    alignItems: 'center',
    gap: 8,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  confirmedCard: {
    alignItems: 'center',
    gap: 8,
  },
  confirmedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
  },
  muted: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    textAlign: 'center',
  },
});

