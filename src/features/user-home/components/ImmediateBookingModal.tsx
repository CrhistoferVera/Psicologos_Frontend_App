import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { appTheme } from '../../../theme/appTheme';
import { createImmediateBooking, type ImmediateProfessional } from '../../../api/immediateAvailability';
import { pendingPaymentStore } from '../../bookings/stores/pendingPaymentStore';
import { useUserRegion } from '../../../hooks/useUserRegion';

const NO_IMAGE = require('../../../../assets/no_image.jpg');

type Props = {
  visible: boolean;
  item: ImmediateProfessional | null;
  nowMs: number;
  onClose: () => void;
};

function formatCountdown(expiresAt: string, nowMs: number) {
  const ms = new Date(expiresAt).getTime() - nowMs;
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ImmediateBookingModal({ visible, item, nowMs, onClose }: Props) {
  const router = useRouter();
  const { isBolivian } = useUserRegion();
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const { professional, priceBob, priceUsd, durationMinutes, description, expiresAt } = item;
  const priceLabel = isBolivian ? `Bs. ${priceBob}` : `$${priceUsd} USD`;
  const fullName = [professional.firstName, professional.lastName].filter(Boolean).join(' ') || 'Psicólogo';
  const avatar = professional.avatarUrl ? { uri: professional.avatarUrl } : NO_IMAGE;
  const countdown = formatCountdown(expiresAt, nowMs);
  const isExpired = new Date(expiresAt).getTime() <= nowMs;

  async function handlePay() {
    setLoading(true);
    try {
      const result = await createImmediateBooking(professional.id);
      pendingPaymentStore.set(result.booking.id, result.paymentInit);
      onClose();
      router.push({
        pathname: '/(user)/bookings/payment/[bookingId]',
        params: { bookingId: result.booking.id },
      } as any);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo iniciar el pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>

          {/* Botón cerrar */}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={16} color={appTheme.colors.textMuted} />
          </Pressable>

          {/* Header: avatar + nombre + badge */}
          <View style={styles.header}>
            <View style={styles.avatarWrap}>
              <Image source={avatar} style={styles.avatar} />
              <View style={styles.avatarBadge}>
                <Ionicons name="flash" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
              {professional.specialties.length > 0 && (
                <Text style={styles.specialtyLine} numberOfLines={1}>
                  {professional.specialties.slice(0, 2).join(' · ')}
                </Text>
              )}
              <View style={styles.sessionBadge}>
                <Ionicons name="flash" size={11} color="#DC2626" />
                <Text style={styles.sessionBadgeText}>Sesión Inmediata</Text>
              </View>
            </View>
          </View>

          {/* Tarjetas de precio y duración */}
          <View style={styles.detailsRow}>
            <View style={styles.detailCard}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="cash-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.detailCardLabel}>Precio</Text>
              <Text style={styles.detailCardValue}>{priceLabel}</Text>
              <Text style={styles.detailCardSub}>sesión inmediata</Text>
            </View>

            <View style={styles.detailCardDivider} />

            <View style={styles.detailCard}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="time-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.detailCardLabel}>Duración</Text>
              <Text style={styles.detailCardValue}>{durationMinutes} min</Text>
              <Text style={styles.detailCardSub}>tiempo de sesión</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }} contentContainerStyle={{ gap: 12 }}>
            {/* Especialidades */}
            {professional.specialties.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Especialidades</Text>
                </View>
                <View style={styles.chipsRow}>
                  {professional.specialties.slice(0, 5).map((s) => (
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
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>¿Qué atiende en esta sesión?</Text>
                </View>
                <Text style={styles.descText}>"{description}"</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Countdown */}
          <View style={[styles.countdownRow, isExpired && styles.countdownExpired]}>
            <Ionicons
              name={isExpired ? 'alert-circle-outline' : 'hourglass-outline'}
              size={14}
              color={isExpired ? '#DC2626' : '#15803D'}
            />
            <Text style={[styles.countdownText, isExpired && styles.countdownTextExpired]}>
              {isExpired ? 'Esta sesión ya no está disponible' : `Disponible por: ${countdown}`}
            </Text>
          </View>

          {/* Botón pagar */}
          <Pressable
            style={[styles.payBtn, (loading || isExpired) && styles.payBtnDisabled]}
            onPress={handlePay}
            disabled={loading || isExpired}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="flash" size={18} color="#FFFFFF" />
                <Text style={styles.payBtnText}>Realizar el pago</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={onClose} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancelar</Text>
          </Pressable>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingRight: 36,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#E2E8F0',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    color: appTheme.colors.text,
    lineHeight: 22,
  },
  specialtyLine: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    color: appTheme.colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  sessionBadgeText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.2,
  },

  // Tarjetas precio/duración
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  detailCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  detailCardDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    fontSize: 18,
    fontWeight: '700',
    color: appTheme.colors.text,
  },
  detailCardSub: {
    fontFamily: appTheme.fonts.body,
    fontSize: 10,
    color: appTheme.colors.textMuted,
    opacity: 0.75,
  },

  // Secciones (especialidades / descripción)
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionDot: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: appTheme.colors.primary,
  },
  sectionTitle: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: '700',
    color: appTheme.colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chipText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  descText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
    lineHeight: 19,
    fontStyle: 'italic',
  },

  // Countdown
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 10,
  },
  countdownExpired: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  countdownText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  countdownTextExpired: {
    color: '#DC2626',
  },

  // Botón pagar
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  cancelLinkText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
});
