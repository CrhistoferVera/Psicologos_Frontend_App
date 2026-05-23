import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getAvailableSlots, type AvailableSlot } from '../../../api/bookings';
import AppButton from '../../../components/ui/AppButton';
import { appTheme } from '../../../theme/appTheme';

type DateOption = { key: string; label: string; dayName: string };

export type BookingRescheduleModalBooking = {
  professionalId: string;
  sessionOfferingId: string;
  scheduledStartAt: string;
  scheduledEndAt?: string;
  timezone?: string;
  sessionDurationMinutes?: number;
};

type BookingRescheduleSelection = {
  proposedStartAt: string;
  proposedTimezone: string;
  reason?: string;
};

type Props = {
  visible: boolean;
  booking: BookingRescheduleModalBooking | null;
  reasonValue: string;
  submitting?: boolean;
  onChangeReason: (value: string) => void;
  onCancel: () => void;
  onSubmit: (selection: BookingRescheduleSelection) => void;
};

const MIN_RESCHEDULE_NOTICE_HOURS = 24;
const MIN_RESCHEDULE_NOTICE_MS = MIN_RESCHEDULE_NOTICE_HOURS * 60 * 60 * 1000;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function makeDateOptions(days = 21): DateOption[] {
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

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${time}`;
}

function isAtLeast24HoursAhead(isoDate: string, now = new Date()) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > now.getTime() + MIN_RESCHEDULE_NOTICE_MS;
}

export default function BookingRescheduleModal({
  visible,
  booking,
  reasonValue,
  submitting = false,
  onChangeReason,
  onCancel,
  onSubmit,
}: Props) {
  const dates = useMemo(() => makeDateOptions(21), []);
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.key ?? todayKey);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotStartAt, setSelectedSlotStartAt] = useState('');
  const selectedTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/La_Paz',
    [],
  );

  useEffect(() => {
    if (!visible) return;
    setSelectedDate(dates[0]?.key ?? todayKey);
    setSelectedSlotStartAt('');
  }, [visible, dates, todayKey]);

  useEffect(() => {
    if (!visible || !booking) return;
    if (!selectedDate) return;

    void (async () => {
      try {
        setLoadingSlots(true);
        const data = await getAvailableSlots({
          professionalId: booking.professionalId,
          sessionOfferingId: booking.sessionOfferingId,
          date: selectedDate,
          timezone: selectedTimezone,
        });
        const now = Date.now();
        const minStart = now + MIN_RESCHEDULE_NOTICE_MS;
        const filtered = data.filter((slot) => {
          const slotTime = new Date(slot.startAt).getTime();
          return Number.isFinite(slotTime) && slotTime > now && slotTime > minStart;
        });
        setSlots(filtered);
        setSelectedSlotStartAt((current) =>
          filtered.some((slot) => slot.startAt === current) ? current : '',
        );
      } catch (err: any) {
        setSlots([]);
        Alert.alert('Error', err?.response?.data?.message ?? 'No se pudieron cargar los horarios.');
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [booking, selectedDate, selectedTimezone, visible]);

  const weeks = useMemo(() => {
    const todayWeekday = new Date().getDay();
    const offset = todayWeekday === 0 ? 6 : todayWeekday - 1;
    const padded: (DateOption | null)[] = [...new Array<null>(offset).fill(null), ...dates];
    const result: (DateOption | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      const week = padded.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      result.push(week);
    }
    return result;
  }, [dates]);

  const selectedSlot = slots.find((slot) => slot.startAt === selectedSlotStartAt) ?? null;
  const selectedDateOption = dates.find((item) => item.key === selectedDate) ?? null;

  function handleSubmit() {
    if (!selectedSlot) {
      Alert.alert('Validación', 'Selecciona un horario disponible.');
      return;
    }

    if (!isAtLeast24HoursAhead(selectedSlot.startAt)) {
      Alert.alert('Validación', 'Solo puedes reprogramar con al menos 24 horas de anticipación.');
      return;
    }

    onSubmit({
      proposedStartAt: selectedSlot.startAt,
      proposedTimezone: selectedSlot.timezone || selectedTimezone,
      reason: reasonValue.trim() || undefined,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Solicitar reprogramación</Text>
            <Text style={styles.subtitle}>
              Selecciona un nuevo horario disponible para reprogramar tu cita.
            </Text>

            <Text style={styles.label}>Fecha</Text>
            <View style={styles.calendarHeader}>
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                <View key={day} style={styles.calendarHeaderCell}>
                  <Text style={styles.calendarHeaderText}>{day}</Text>
                </View>
              ))}
            </View>
            {(() => {
              let lastMonth = '';
              return weeks.map((week) => {
                const firstDate = week.find((d) => d !== null);
                const weekKey = firstDate?.key ?? 'empty';
                const weekMonth = firstDate ? firstDate.key.slice(0, 7) : '';
                const showMonthLabel = weekMonth && weekMonth !== lastMonth;
                if (showMonthLabel) lastMonth = weekMonth;
                const monthLabel = showMonthLabel
                  ? new Date(`${weekMonth}-15`).toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })
                  : null;

                return (
                  <View key={weekKey}>
                    {monthLabel && (
                      <Text style={styles.calendarMonthLabel}>
                        {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
                      </Text>
                    )}
                    <View style={styles.calendarRow}>
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
                              {Number.parseInt(date.key.slice(8), 10)}
                            </Text>
                            {todayKey === date.key && selectedDate !== date.key && (
                              <View style={styles.calendarCellToday} />
                            )}
                          </Pressable>
                        ),
                      )}
                    </View>
                  </View>
                );
              });
            })()}

            <Text style={styles.label}>Horarios disponibles</Text>
            {loadingSlots ? (
              <Text style={styles.muted}>Buscando horarios disponibles...</Text>
            ) : slots.length === 0 ? (
              <Text style={styles.muted}>
                No hay horarios disponibles para este día
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

            {selectedSlot ? (
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Resumen</Text>
                <Text style={styles.summaryText}>Fecha y hora: {formatDateTime(selectedSlot.startAt)}</Text>
                {booking?.sessionDurationMinutes ? (
                  <Text style={styles.summaryText}>Duración: {booking.sessionDurationMinutes} min</Text>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.label}>Motivo (opcional)</Text>
            <TextInput
              value={reasonValue}
              onChangeText={onChangeReason}
              style={[styles.input, styles.multiline]}
              placeholder="Escribe un motivo"
              placeholderTextColor={appTheme.colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={500}
            />

            <Text style={styles.note}>
              No hay devoluciones. El pago original se mantiene asociado a la cita.
            </Text>
            <Text style={styles.noteSecondary}>
              Solo puedes reprogramar con al menos 24 horas de anticipación.
            </Text>
          </ScrollView>

          <View style={styles.actions}>
            <AppButton title="Cancelar" variant="secondary" onPress={onCancel} disabled={submitting} />
            <AppButton
              title={submitting ? 'Enviando...' : 'Solicitar reprogramación'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={!selectedSlotStartAt || loadingSlots}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 14,
    gap: 8,
  },
  sheetContent: {
    gap: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
  },
  subtitle: {
    fontSize: 12,
    color: '#334155',
    fontFamily: appTheme.fonts.body,
  },
  label: {
    fontSize: 12,
    color: '#334155',
    fontFamily: appTheme.fonts.body,
    fontWeight: '600',
    marginTop: 4,
  },
  muted: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  calendarHeader: {
    flexDirection: 'row',
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
  calendarMonthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    marginTop: 8,
    marginBottom: 2,
    paddingLeft: 2,
  },
  calendarRow: {
    flexDirection: 'row',
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
  slotBtn: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
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
  summary: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9E3EF',
    padding: 10,
    backgroundColor: '#F8FAFC',
    gap: 2,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  summaryText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: appTheme.fonts.body,
  },
  input: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  multiline: {
    minHeight: 78,
    paddingTop: 10,
  },
  note: {
    marginTop: 4,
    fontSize: 12,
    color: '#92400E',
    fontFamily: appTheme.fonts.body,
  },
  noteSecondary: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: appTheme.fonts.body,
  },
  actions: {
    marginTop: 2,
    gap: 8,
  },
});
