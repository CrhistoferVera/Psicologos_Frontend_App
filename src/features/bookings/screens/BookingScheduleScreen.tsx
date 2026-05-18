import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../../../components/ui/AppCard';
import AppScreen from '../../../components/ui/AppScreen';
import AppButton from '../../../components/ui/AppButton';
import { appTheme } from '../../../theme/appTheme';
import { useAuth } from '../../../context/AuthContext';
import { useUserRegion } from '../../../hooks/useUserRegion';
import { formatBob, formatUsd } from '../../../utils/money';
import {
  createBatchBookings,
  getAvailableSlots,
  getProfessionalSessionOfferings,
  type AvailableSlot,
  type ProfessionalSessionOffering,
} from '../../../api/bookings';
import { safeBack } from '../../../utils/navigation';

type DateOption = { key: string; label: string; dayName: string };

type CartSession = {
  offeringId: string;
  slotStartAt: string;
  slotTimezone: string;
  dateLabel: string;
  timeLabel: string;
  offeringTitle: string;
  priceBob: number;
  priceUsd: number;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function makeDateOptions(days = 7): DateOption[] {
  const now = new Date();
  const formatterDay = new Intl.DateTimeFormat('es-BO', { weekday: 'short' });
  const formatterDate = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: '2-digit' });

  return Array.from({ length: days }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() + idx);
    return {
      key: toDateKey(d),
      dayName: formatterDay.format(d).replace('.', ''),
      label: formatterDate.format(d),
    };
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function BookingScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isBolivian } = useUserRegion();
  const params = useLocalSearchParams<{
    professionalId?: string | string[];
    professionalName?: string | string[];
    offeringId?: string | string[];
  }>();

  const professionalId = Array.isArray(params.professionalId)
    ? params.professionalId[0]
    : params.professionalId ?? '';
  const professionalName = Array.isArray(params.professionalName)
    ? params.professionalName[0]
    : params.professionalName ?? 'Profesional';
  const initialOfferingId = Array.isArray(params.offeringId) ? params.offeringId[0] : params.offeringId;

  const dates = useMemo(() => makeDateOptions(21), []);
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.key ?? todayKey);

  const weeks = useMemo(() => {
    const todayWeekday = new Date().getDay();
    const offset = todayWeekday === 0 ? 6 : todayWeekday - 1;
    const padded: (DateOption | null)[] = [...new Array<null>(offset).fill(null), ...dates];
    const result: (DateOption | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      const w = padded.slice(i, i + 7);
      while (w.length < 7) w.push(null);
      result.push(w);
    }
    return result;
  }, [dates]);

  const [offerings, setOfferings] = useState<ProfessionalSessionOffering[]>([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');

  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotStartAt, setSelectedSlotStartAt] = useState<string>('');
  const [cart, setCart] = useState<CartSession[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/La_Paz';
  const canDetermineRegion = useMemo(
    () => Boolean((user?.phoneDialCode ?? '').trim()),
    [user?.phoneDialCode],
  );
  const currency = canDetermineRegion ? (isBolivian ? 'BOB' : 'USD') : null;

  useEffect(() => {
    if (!professionalId) return;

    void (async () => {
      try {
        setLoadingOfferings(true);
        const data = await getProfessionalSessionOfferings(professionalId);
        setOfferings(data);
        const fallbackId = initialOfferingId && data.some((o) => o.id === initialOfferingId)
          ? initialOfferingId
          : data[0]?.id;
        setSelectedOfferingId(fallbackId ?? '');
      } catch {
        Alert.alert('Error', 'No se pudieron cargar las sesiones del profesional.');
      } finally {
        setLoadingOfferings(false);
      }
    })();
  }, [professionalId, initialOfferingId]);

  useEffect(() => {
    if (!professionalId || !selectedOfferingId || !selectedDate) {
      setSlots([]);
      return;
    }

    void (async () => {
      try {
        setLoadingSlots(true);
        const data = await getAvailableSlots({
          professionalId,
          sessionOfferingId: selectedOfferingId,
          date: selectedDate,
          timezone: selectedTimezone,
        });
        setSlots(data);
        setSelectedSlotStartAt((current) =>
          data.some((slot) => slot.startAt === current) ? current : '',
        );
      } catch (err: any) {
        setSlots([]);
        Alert.alert('Error', err?.response?.data?.message ?? 'No se pudieron cargar los horarios.');
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [professionalId, selectedOfferingId, selectedDate]);

  const selectedOffering = offerings.find((item) => item.id === selectedOfferingId) ?? null;
  const selectedSlot = slots.find((slot) => slot.startAt === selectedSlotStartAt) ?? null;
  const selectedDateOption = dates.find((item) => item.key === selectedDate) ?? null;

  function handleAddToCart() {
    if (!selectedSlot || !selectedDateOption || !selectedOffering) return;
    if (cart.some((s) => s.slotStartAt === selectedSlot.startAt)) return;
    setCart((prev) => [
      ...prev,
      {
        offeringId: selectedOffering.id,
        slotStartAt: selectedSlot.startAt,
        slotTimezone: selectedSlot.timezone,
        dateLabel: selectedDateOption.label,
        timeLabel: formatTime(selectedSlot.startAt),
        offeringTitle: selectedOffering.title,
        priceBob: selectedOffering.priceBob,
        priceUsd: selectedOffering.priceUsd,
      },
    ]);
    setSelectedSlotStartAt('');
  }

  function handleConfirmSessions() {
    if (!professionalId || !selectedOffering || cart.length === 0) return;

    const plural = cart.length === 1 ? 'sesión' : `${cart.length} sesiones`;
    Alert.alert(
      'Confirmar reserva',
      `¿Está seguro que desea reservar ${plural}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => void doCreateBookings() },
      ],
    );
  }

  async function doCreateBookings() {
    if (!professionalId || !selectedOffering || cart.length === 0) return;

    try {
      setSubmitting(true);
      const result = await createBatchBookings({
        bookings: cart.map((s) => ({
          professionalId,
          sessionOfferingId: s.offeringId,
          scheduledStartAt: s.slotStartAt,
          timezone: s.slotTimezone,
        })),
      });
      router.replace({
        pathname: '/(user)/bookings/payment/[bookingId]',
        params: {
          bookingId: result.bookings[0].id,
          bookingIds: result.bookings.map((b) => b.id).join(','),
          professionalName,
        },
      } as any);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudieron crear las reservas.');
    } finally {
      setSubmitting(false);
    }
  }

  const plural = cart.length === 1 ? '' : 'es';
  const ctaTitle = submitting ? 'Confirmando...' : `Confirmar ${cart.length} sesión${plural}`;

  return (
    <AppScreen scroll contentPadding={0}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => safeBack(router, '/(user)')}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Reservar sesión</Text>
            <Text style={styles.subtitle}>{professionalName}</Text>
          </View>
        </View>

        <AppCard>
          <Text style={styles.blockTitle}>1. Selecciona una sesión</Text>
          {loadingOfferings ? (
            <Text style={styles.muted}>Cargando sesiones...</Text>
          ) : offerings.length === 0 ? (
            <Text style={styles.muted}>Este profesional aún no tiene sesiones activas.</Text>
          ) : (
            <View style={styles.stack}>
              {offerings.map((offering) => {
                const selected = selectedOfferingId === offering.id;
                return (
                  <Pressable
                    key={offering.id}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => {
                      setSelectedOfferingId(offering.id);
                      setSelectedSlotStartAt('');
                      setSlots([]);
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.optionTitle}>{offering.title}</Text>
                      {!!offering.description && (
                        <Text style={styles.optionSubtitle}>{offering.description}</Text>
                      )}
                      <Text style={styles.optionMeta}>{offering.durationMinutes} min</Text>
                    </View>
                    <View style={styles.priceWrap}>
                      {!canDetermineRegion ? (
                        <Text style={styles.priceUsd}>
                          Completa tu país y teléfono para continuar.
                        </Text>
                      ) : currency === 'USD' ? (
                        <Text style={styles.priceBob}>{formatUsd(offering.priceUsd, true)}</Text>
                      ) : (
                        <Text style={styles.priceBob}>{formatBob(offering.priceBob)}</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
          {!canDetermineRegion && (
            <Text style={[styles.muted, { marginTop: 8, color: appTheme.colors.danger }]}>
              Completa tu país y teléfono para continuar.
            </Text>
          )}
        </AppCard>

        <AppCard>
          <Text style={styles.blockTitle}>2. Selecciona fecha</Text>
          <View style={styles.calendarHeader}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <View key={d} style={styles.calendarHeaderCell}>
                <Text style={styles.calendarHeaderText}>{d}</Text>
              </View>
            ))}
          </View>
          {weeks.map((week) => {
            const weekKey = week.find((d) => d !== null)?.key ?? 'empty';
            return (
            <View key={weekKey} style={styles.calendarRow}>
              {week.map((date, di) =>
                date === null ? (
                  <View key={`empty-${weekKey}-${di}`} style={styles.calendarCell} />
                ) : (
                  <Pressable
                    key={date.key}
                    style={[styles.calendarCell, selectedDate === date.key && styles.calendarCellActive]}
                    onPress={() => setSelectedDate(date.key)}
                  >
                    <Text style={[styles.calendarDayNum, selectedDate === date.key && styles.calendarDayNumActive]}>
                      {Number.parseInt(date.key.slice(8))}
                    </Text>
                    {todayKey === date.key && selectedDate !== date.key && (
                      <View style={styles.calendarCellToday} />
                    )}
                  </Pressable>
                )
              )}
            </View>
            );
          })}
        </AppCard>

        <AppCard>
          <View style={styles.slotHeader}>
            <Text style={[styles.blockTitle, { marginBottom: 0 }]}>3. Selecciona horario</Text>
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}/3</Text>
              </View>
            )}
          </View>
          {loadingSlots ? (
            <Text style={styles.muted}>Buscando horarios disponibles...</Text>
          ) : slots.length === 0 ? (
            <Text style={styles.muted}>
              No hay horarios disponibles para esta fecha
              {selectedDateOption ? ` (${selectedDateOption.label})` : ''}.
            </Text>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map((slot) => {
                const active = selectedSlotStartAt === slot.startAt;
                const inCart = cart.some((s) => s.slotStartAt === slot.startAt);
                return (
                  <Pressable
                    key={slot.startAt}
                    style={[styles.slotBtn, active && styles.slotBtnActive, inCart && styles.slotBtnInCart]}
                    onPress={() => setSelectedSlotStartAt(slot.startAt)}
                    disabled={inCart}
                  >
                    {inCart && (
                      <Ionicons name="checkmark" size={11} color="#16A34A" style={{ marginRight: 2 }} />
                    )}
                    <Text style={[styles.slotText, active && styles.slotTextActive, inCart && styles.slotTextInCart]}>
                      {formatTime(slot.startAt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {selectedSlot && cart.length < 3 && (
            <Pressable style={styles.addSessionBtn} onPress={handleAddToCart}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.addSessionBtnText}>Agregar </Text>
            </Pressable>
          )}
          {cart.length === 3 && (
            <Text style={styles.cartFullHint}>Máximo de 3 sesiones alcanzado</Text>
          )}
        </AppCard>

        {cart.length > 0 && (
          <AppCard>
            <Text style={styles.blockTitle}>Resumen del pedido</Text>
            <View style={styles.cartList}>
              {cart.map((session, idx) => (
                <View key={session.slotStartAt} style={styles.cartItem}>
                  <View style={styles.cartItemLeft}>
                    <View style={styles.cartItemBadge}>
                      <Text style={styles.cartItemBadgeText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemTitle}>{session.offeringTitle}</Text>
                      <Text style={styles.cartItemMeta}>
                        {session.dateLabel} · {session.timeLabel}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cartItemRight}>
                    <Text style={styles.cartItemPrice}>
                      {currency === 'USD' ? formatUsd(session.priceUsd, true) : formatBob(session.priceBob)}
                    </Text>
                    <Pressable
                      onPress={() => setCart((prev) => prev.filter((s) => s.slotStartAt !== session.slotStartAt))}
                      style={styles.cartRemoveBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={14} color={appTheme.colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.cartDivider} />
            <View style={styles.cartTotalRow}>
              <Text style={styles.cartTotalLabel}>
                Subtotal ({cart.length} sesión{plural})
              </Text>
              <Text style={styles.cartTotalAmount}>
                {currency === 'USD'
                  ? formatUsd(cart.reduce((s, item) => s + item.priceUsd, 0), true)
                  : formatBob(cart.reduce((s, item) => s + item.priceBob, 0))}
              </Text>
            </View>
          </AppCard>
        )}

        <AppButton
          title={ctaTitle}
          onPress={handleConfirmSessions}
          loading={submitting}
          disabled={
            cart.length === 0 ||
            !selectedOffering ||
            loadingOfferings ||
            loadingSlots ||
            !canDetermineRegion ||
            submitting
          }
        />
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
    fontSize: 15,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    marginBottom: 8,
  },
  muted: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  stack: {
    gap: 8,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: '#D9E3EF',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionCardSelected: {
    borderColor: appTheme.colors.primary,
    backgroundColor: '#EEF4FF',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  optionSubtitle: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  optionMeta: {
    fontSize: 12,
    color: '#475569',
    fontFamily: appTheme.fonts.body,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  priceBob: {
    fontSize: 14,
    fontWeight: '700',
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
  },
  priceUsd: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: appTheme.fonts.body,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  calendarHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  calendarCellActive: {
    backgroundColor: appTheme.colors.primary,
  },
  calendarDayNum: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  calendarDayNumActive: {
    color: '#FFFFFF',
  },
  calendarCellToday: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: appTheme.colors.primary,
    marginTop: 2,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  slotBtn: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotBtnActive: {
    backgroundColor: '#E8F4EC',
    borderColor: '#16A34A',
  },
  slotBtnInCart: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
    opacity: 0.7,
  },
  slotText: {
    fontSize: 13,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontWeight: '600',
  },
  slotTextActive: {
    color: '#166534',
  },
  slotTextInCart: {
    color: '#16A34A',
  },
  addSessionBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: appTheme.colors.primary,
    borderRadius: 10,
    paddingVertical: 11,
  },
  addSessionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: appTheme.fonts.heading,
  },
  cartBadge: {
    backgroundColor: appTheme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: appTheme.fonts.heading,
  },
  cartFullHint: {
    marginTop: 12,
    fontSize: 12,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    textAlign: 'center',
  },
  cartList: {
    gap: 10,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  cartItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cartItemBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: appTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: appTheme.fonts.heading,
  },
  cartItemInfo: {
    flex: 1,
    gap: 2,
  },
  cartItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  cartItemMeta: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  cartItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cartItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
  },
  cartRemoveBtn: {
    padding: 2,
  },
  cartDivider: {
    height: 1,
    backgroundColor: appTheme.colors.border,
    marginVertical: 10,
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
  },
  cartTotalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
  },
});

