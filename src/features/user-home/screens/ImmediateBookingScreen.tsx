import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { appTheme } from '../../../theme/appTheme';
import {
  createImmediateBooking,
  getProfessionalImmediateDetail,
  type ImmediateProfessional,
} from '../../../api/immediateAvailability';
import { getMyBooking, getBookingQrStatus, type BookingPaymentInitResponse } from '../../../api/bookings';
import { useUserRegion } from '../../../hooks/useUserRegion';

const NO_IMAGE = require('../../../../assets/no_image.jpg');

type ScreenState = 'idle' | 'paying' | 'qr' | 'confirmed' | 'expired';

function formatCountdown(expiresAt: string, nowMs: number) {
  const ms = new Date(expiresAt).getTime() - nowMs;
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPaymentCountdown(expiresAt: string | null | undefined, nowMs: number) {
  if (!expiresAt) return '--:--';
  return formatCountdown(expiresAt, nowMs);
}

export default function ImmediateBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isBolivian } = useUserRegion();
  const { professionalId } = useLocalSearchParams<{ professionalId: string }>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [item, setItem] = useState<ImmediateProfessional | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [paymentInit, setPaymentInit] = useState<BookingPaymentInitResponse | null>(null);
  const [_bookingId, setBookingId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void load();
    tickRef.current = setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [professionalId]);

  async function load() {
    if (!professionalId) return;
    setLoadingData(true);
    try {
      const data = await getProfessionalImmediateDetail(professionalId);
      setItem(data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la información de la sesión.');
      router.back();
    } finally {
      setLoadingData(false);
    }
  }

  function startPolling(bId: string, qrId?: string) {
    pollRef.current = setInterval(async () => {
      try {
        if (qrId) {
          try {
            const qrStatus = await getBookingQrStatus(qrId);
            if (qrStatus.status === 'PAID') {
              if (pollRef.current) clearInterval(pollRef.current);
              setScreenState('confirmed');
              return;
            }
          } catch { /* silent */ }
        }
        const booking = await getMyBooking(bId);
        if (booking.status === 'CONFIRMED') {
          if (pollRef.current) clearInterval(pollRef.current);
          setScreenState('confirmed');
        } else if (booking.status === 'EXPIRED' || booking.status.startsWith('CANCELLED')) {
          if (pollRef.current) clearInterval(pollRef.current);
          setScreenState('expired');
        }
      } catch {
        // silent
      }
    }, 4000);
  }

  async function handlePay() {
    if (!item) return;
    setScreenState('paying');
    try {
      const result = await createImmediateBooking(item.professional.id);
      setBookingId(result.booking.id);
      setPaymentInit(result.paymentInit);

      if (result.paymentInit.paymentMethod === 'BANECO_QR') {
        setScreenState('qr');
        startPolling(result.booking.id, result.paymentInit.providerReference ?? undefined);
        return;
      }

      if (result.paymentInit.paymentMethod === 'STRIPE') {
        const { paymentIntentClientSecret, customerId, ephemeralKey } = result.paymentInit;
        if (!paymentIntentClientSecret) throw new Error('No se recibió el client secret de Stripe.');

        const sheetConfig: any = {
          merchantDisplayName: 'SanaMente',
          paymentIntentClientSecret,
          appearance: { colors: { primary: appTheme.colors.primary } },
        };
        if (customerId && ephemeralKey) {
          sheetConfig.customerId = customerId;
          sheetConfig.customerEphemeralKeySecret = ephemeralKey;
        }

        const { error: initError } = await initPaymentSheet(sheetConfig);
        if (initError) throw new Error(initError.message);

        setScreenState('idle'); // quitar spinner antes de abrir sheet
        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          if (presentError.code !== 'Canceled') {
            Alert.alert('Pago fallido', presentError.message);
          }
          setScreenState('idle');
          return;
        }

        setScreenState('confirmed');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? err?.message ?? 'No se pudo iniciar el pago.');
      setScreenState('idle');
    }
  }

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Cargando sesión inmediata...</Text>
        </View>
      </View>
    );
  }

  if (!item) return null;

  const { professional, priceBob, priceUsd, durationMinutes, description, expiresAt } = item;
  const priceLabel = isBolivian ? `Bs. ${priceBob}` : `$${priceUsd} USD`;
  const fullName = [professional.firstName, professional.lastName].filter(Boolean).join(' ') || 'Psicólogo';
  const avatar = professional.avatarUrl ? { uri: professional.avatarUrl } : NO_IMAGE;
  const sessionCountdown = formatCountdown(expiresAt, nowMs);
  const isSessionExpired = new Date(expiresAt).getTime() <= nowMs;

  // ── CONFIRMADO ────────────────────────────────────────────────────────────
  if (screenState === 'confirmed') {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={{ width: 36 }} />
          <Text style={styles.headerTitle}>Sesión Inmediata</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.confirmedContainer}>
          <View style={styles.confirmedIconWrap}>
            <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
          </View>
          <Text style={styles.confirmedTitle}>¡Sesión confirmada!</Text>
          <Text style={styles.confirmedSub}>
            El psicólogo fue notificado. Puedes iniciar la sesión ahora mismo a través del chat o llamada.
          </Text>
          <Pressable
            style={styles.goToBookingsBtn}
            onPress={() => router.replace('/(user)/bookings' as any)}
          >
            <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            <Text style={styles.goToBookingsBtnText}>Ver mis reservas</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── QR ───────────────────────────────────────────────────────────────────
  if (screenState === 'qr' && paymentInit) {
    const qrImage = paymentInit.qrImage;
    const paymentExpiry = (paymentInit as any).expiresAt ?? null;
    const paymentCountdown = formatPaymentCountdown(paymentExpiry, nowMs);

    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={{ width: 36 }} />
          <Text style={styles.headerTitle}>Realizar pago</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Mini perfil */}
          <View style={styles.miniProfile}>
            <Image source={avatar} style={styles.miniAvatar} />
            <View>
              <Text style={styles.miniName}>{fullName}</Text>
              <Text style={styles.miniPrice}>{priceLabel} · {durationMinutes} min</Text>
            </View>
          </View>

          {/* QR Card */}
          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <Ionicons name="qr-code" size={20} color={appTheme.colors.primary} />
              <Text style={styles.qrTitle}>Escanea para pagar</Text>
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
                <Text style={styles.qrPlaceholderText}>Generando QR...</Text>
              </View>
            )}

            {paymentInit.providerReference && (
              <Text style={styles.qrRef}>Ref: {paymentInit.providerReference}</Text>
            )}

            {paymentExpiry && (
              <View style={styles.qrCountdownRow}>
                <Ionicons name="hourglass-outline" size={14} color="#92400E" />
                <Text style={styles.qrCountdownText}>
                  Expira en: <Text style={styles.qrCountdownTimer}>{paymentCountdown}</Text>
                </Text>
              </View>
            )}

            <View style={styles.qrHintRow}>
              <Ionicons name="information-circle-outline" size={14} color={appTheme.colors.textMuted} />
              <Text style={styles.qrHint}>
                La sesión se confirma automáticamente al detectar tu pago en Banco Unión.
              </Text>
            </View>
          </View>

          {/* Esperando confirmación */}
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color={appTheme.colors.primary} />
            <Text style={styles.waitingText}>Esperando confirmación de pago...</Text>
          </View>

        </ScrollView>
      </View>
    );
  }

  // ── IDLE / PAYING ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={appTheme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sesión Inmediata</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Perfil del psicólogo */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={avatar} style={styles.avatar} />
            <View style={styles.avatarBadge}>
              <Ionicons name="flash" size={11} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{fullName}</Text>
            {professional.specialties.length > 0 && (
              <Text style={styles.specialtyLine} numberOfLines={1}>
                {professional.specialties.slice(0, 2).join(' · ')}
              </Text>
            )}
            <View style={styles.sessionBadge}>
              <Ionicons name="flash" size={11} color="#DC2626" />
              <Text style={styles.sessionBadgeText}>Sesión Inmediata disponible</Text>
            </View>
          </View>
        </View>

        {/* Countdown disponibilidad */}
        <View style={[styles.countdownCard, isSessionExpired && styles.countdownCardExpired]}>
          <Ionicons
            name={isSessionExpired ? 'alert-circle-outline' : 'hourglass-outline'}
            size={16}
            color={isSessionExpired ? '#DC2626' : '#15803D'}
          />
          <Text style={[styles.countdownText, isSessionExpired && styles.countdownTextExpired]}>
            {isSessionExpired ? 'Esta sesión ya no está disponible' : `Disponible por: ${sessionCountdown}`}
          </Text>
        </View>

        {/* Precio / duración */}
        <View style={styles.detailsRow}>
          <View style={styles.detailCard}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="cash-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.detailCardLabel}>Precio</Text>
            <Text style={styles.detailCardValue}>{priceLabel}</Text>
            <Text style={styles.detailCardSub}>sesión inmediata</Text>
          </View>
          <View style={styles.detailCardDivider} />
          <View style={styles.detailCard}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="time-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.detailCardLabel}>Duración</Text>
            <Text style={styles.detailCardValue}>{durationMinutes} min</Text>
            <Text style={styles.detailCardSub}>tiempo de sesión</Text>
          </View>
        </View>

        {/* Especialidades */}
        {professional.specialties.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Especialidades</Text>
            </View>
            <View style={styles.chipsRow}>
              {professional.specialties.map((s) => (
                <View key={s} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Descripción */}
        {description ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>¿Qué atiende en esta sesión?</Text>
            </View>
            <View style={styles.descCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={appTheme.colors.textMuted} />
              <Text style={styles.descText}>"{description}"</Text>
            </View>
          </View>
        ) : null}

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color="#2563EB" />
          <Text style={styles.infoText}>
            Tras completar el pago, el psicólogo será notificado y podrás iniciar la sesión de inmediato a través del chat o llamada.
          </Text>
        </View>

        {/* Botón pagar */}
        <Pressable
          style={[styles.payBtn, (screenState === 'paying' || isSessionExpired) && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={screenState === 'paying' || isSessionExpired}
        >
          {screenState === 'paying' ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.payBtnText}>Procesando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#FFFFFF" />
              <Text style={styles.payBtnText}>Realizar el pago</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.cancelLink}>
          <Text style={styles.cancelLinkText}>Cancelar</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: '700',
    color: appTheme.colors.text,
  },

  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },

  // Perfil
  profileCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#E2E8F0',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  profileInfo: { flex: 1, gap: 4 },
  name: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    color: appTheme.colors.text,
  },
  specialtyLine: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF1F2',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  sessionBadgeText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Countdown disponibilidad
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  countdownCardExpired: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  countdownText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  countdownTextExpired: { color: '#DC2626' },

  // Precio / duración
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  detailCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    gap: 5,
  },
  detailCardDivider: {
    width: 1,
    backgroundColor: appTheme.colors.border,
    marginVertical: 14,
  },
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  detailCardLabel: {
    fontFamily: appTheme.fonts.body,
    fontSize: 10,
    fontWeight: '700',
    color: appTheme.colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  detailCardValue: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    color: appTheme.colors.text,
  },
  detailCardSub: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    color: appTheme.colors.textMuted,
    opacity: 0.8,
  },

  // Secciones
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: appTheme.colors.primary,
  },
  sectionTitle: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: appTheme.colors.textMuted,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  descCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 14,
  },
  descText: {
    flex: 1,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    color: appTheme.colors.textMuted,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 19,
  },

  // Botón pagar
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 17,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  payBtnDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  payBtnText: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelLinkText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },

  // ── QR ──────────────────────────────────────────────────────────────────
  miniProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  miniAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#E2E8F0',
  },
  miniName: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: '700',
    color: appTheme.colors.text,
  },
  miniPrice: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    color: appTheme.colors.textMuted,
    marginTop: 2,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  qrTitle: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.colors.text,
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
  qrPlaceholderText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  qrRef: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    color: appTheme.colors.textMuted,
  },
  qrCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  qrCountdownText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: '#92400E',
  },
  qrCountdownTimer: {
    fontFamily: appTheme.fonts.heading,
    fontWeight: '700',
    fontSize: 14,
  },
  qrHintRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  qrHint: {
    flex: 1,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    color: appTheme.colors.textMuted,
    lineHeight: 17,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  waitingText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },

  // ── CONFIRMADO ───────────────────────────────────────────────────────────
  confirmedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  confirmedIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  confirmedTitle: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 24,
    fontWeight: '700',
    color: '#15803D',
    textAlign: 'center',
  },
  confirmedSub: {
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    color: appTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  goToBookingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: appTheme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  goToBookingsBtnText: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
