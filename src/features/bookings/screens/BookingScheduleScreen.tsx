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
  createBooking,
  getAvailableSlots,
  getProfessionalSessionOfferings,
  type AvailableSlot,
  type ProfessionalSessionOffering,
} from '../../../api/bookings';
import { safeBack } from '../../../utils/navigation';

type DateOption = { key: string; label: string; dayName: string };

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

  const dates = useMemo(() => makeDateOptions(7), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.key ?? toDateKey(new Date()));

  const [offerings, setOfferings] = useState<ProfessionalSessionOffering[]>([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');

  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotStartAt, setSelectedSlotStartAt] = useState<string>('');
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

  async function handleCreateBooking() {
    if (!professionalId || !selectedOffering || !selectedSlot) return;

    try {
      setSubmitting(true);
      const booking = await createBooking({
        professionalId,
        sessionOfferingId: selectedOffering.id,
        scheduledStartAt: selectedSlot.startAt,
        timezone: selectedSlot.timezone,
      });

      router.replace({
        pathname: '/(user)/bookings/payment/[bookingId]',
        params: {
          bookingId: booking.id,
          professionalName,
        },
      } as any);
    } catch (err: any) {
      Alert.alert('No se pudo crear la reserva', err?.response?.data?.message ?? 'Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dates.map((date) => {
              const active = selectedDate === date.key;
              return (
                <Pressable
                  key={date.key}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                  onPress={() => setSelectedDate(date.key)}
                >
                  <Text style={[styles.dateDay, active && styles.dateTextActive]}>{date.dayName}</Text>
                  <Text style={[styles.dateLabel, active && styles.dateTextActive]}>{date.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </AppCard>

        <AppCard>
          <Text style={styles.blockTitle}>3. Selecciona horario</Text>
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
                return (
                  <Pressable
                    key={slot.startAt}
                    style={[styles.slotBtn, active && styles.slotBtnActive]}
                    onPress={() => setSelectedSlotStartAt(slot.startAt)}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive]}>
                      {formatTime(slot.startAt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </AppCard>

        <AppButton
          title={submitting ? 'Creando reserva...' : 'Continuar '}
          onPress={() => void handleCreateBooking()}
          loading={submitting}
          disabled={
            !selectedOffering ||
            !selectedSlot ||
            loadingOfferings ||
            loadingSlots ||
            !canDetermineRegion
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
  dateRow: {
    gap: 8,
    paddingRight: 4,
  },
  dateChip: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  dateDay: {
    fontSize: 11,
    color: '#475569',
    fontFamily: appTheme.fonts.body,
    textTransform: 'capitalize',
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  dateTextActive: {
    color: '#FFFFFF',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  slotBtnActive: {
    backgroundColor: '#E8F4EC',
    borderColor: '#16A34A',
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
});

