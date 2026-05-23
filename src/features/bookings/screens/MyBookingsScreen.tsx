import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import AppScreen from '../../../components/ui/AppScreen';
import {
  acceptBookingRescheduleRequest,
  cancelBookingRescheduleRequest,
  createBookingRescheduleRequest,
  getMyBookingRescheduleRequests,
  getMyBookings,
  rejectBookingRescheduleRequest,
  type Booking,
  type BookingRescheduleRequest,
  type BookingRescheduleRequestStatus,
} from '../../../api/bookings';
import { useAuth } from '../../../context/AuthContext';
import { appTheme } from '../../../theme/appTheme';
import { formatMoneyByCurrency } from '../../../utils/money';
import BookingRescheduleModal, { type BookingRescheduleModalBooking } from '../components/BookingRescheduleModal';

function statusLabel(status: Booking['status']) {
  if (status === 'PENDING_PAYMENT') return 'Pendiente de pago';
  if (status === 'CONFIRMED') return 'Confirmada';
  if (status === 'EXPIRED') return 'Expirada';
  if (status === 'CANCELLED_BY_CLIENT') return 'Cancelada por cliente';
  if (status === 'CANCELLED_BY_PROFESSIONAL') return 'Cancelada por profesional';
  if (status === 'COMPLETED') return 'Completada';
  if (status === 'NO_SHOW') return 'No asistida';
  return status;
}

function statusColor(status: Booking['status']) {
  if (status === 'CONFIRMED') return '#166534';
  if (status === 'PENDING_PAYMENT') return appTheme.colors.primary;
  if (status === 'EXPIRED') return '#B91C1C';
  if (status === 'CANCELLED_BY_CLIENT' || status === 'CANCELLED_BY_PROFESSIONAL') return '#991B1B';
  return '#475569';
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
  return date.getTime() > now.getTime() + 24 * 60 * 60 * 1000;
}

function sortRequestsByNewest(requests: BookingRescheduleRequest[]) {
  return [...requests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function getRequestStatusLabel(status: BookingRescheduleRequestStatus) {
  if (status === 'PENDING') return 'Pendiente';
  if (status === 'ACCEPTED') return 'Aceptada';
  if (status === 'REJECTED') return 'Rechazada';
  if (status === 'CANCELLED') return 'Cancelada';
  if (status === 'EXPIRED') return 'Expirada';
  return status;
}

function getRequestStatusColor(status: BookingRescheduleRequestStatus) {
  if (status === 'PENDING') return '#92400E';
  if (status === 'ACCEPTED') return '#166534';
  if (status === 'REJECTED') return '#991B1B';
  if (status === 'CANCELLED') return '#475569';
  if (status === 'EXPIRED') return '#991B1B';
  return '#475569';
}

function getApiErrorMessage(err: any, fallback: string) {
  const raw = err?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join('\n');
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

export default function MyBookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<BookingRescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalBooking, setModalBooking] = useState<Booking | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [bookingRows, requestRows] = await Promise.all([
        getMyBookings(),
        getMyBookingRescheduleRequests(),
      ]);
      const sorted = [...bookingRows].sort(
        (a, b) => new Date(b.scheduledStartAt).getTime() - new Date(a.scheduledStartAt).getTime(),
      );
      setBookings(sorted);
      setRescheduleRequests(Array.isArray(requestRows) ? requestRows : []);
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudieron cargar tus reservas.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const pendingCount = useMemo(
    () => bookings.filter((item) => item.status === 'PENDING_PAYMENT').length,
    [bookings],
  );

  const requestsByBookingId = useMemo(() => {
    const grouped = new Map<string, BookingRescheduleRequest[]>();
    for (const row of rescheduleRequests) {
      const existing = grouped.get(row.bookingId) ?? [];
      existing.push(row);
      grouped.set(row.bookingId, existing);
    }
    for (const [bookingId, rows] of grouped.entries()) {
      grouped.set(bookingId, sortRequestsByNewest(rows));
    }
    return grouped;
  }, [rescheduleRequests]);

  function canCreateRescheduleRequest(booking: Booking, pendingRequest: BookingRescheduleRequest | null) {
    if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') return false;
    if (pendingRequest) return false;
    return isAtLeast24HoursAhead(booking.scheduledStartAt);
  }

  function getRescheduleBlockedMessage(booking: Booking) {
    if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
      return 'Disponible solo para citas confirmadas y pagadas.';
    }
    if (!isAtLeast24HoursAhead(booking.scheduledStartAt)) {
      return 'Solo puedes reprogramar con al menos 24 horas de anticipacion.';
    }
    return 'No se puede solicitar reprogramacion para esta cita.';
  }

  function openRescheduleModal(booking: Booking) {
    setModalBooking(booking);
    setModalReason('');
  }

  function closeRescheduleModal() {
    if (creatingRequest) return;
    setModalBooking(null);
    setModalReason('');
  }

  async function handleSubmitRescheduleRequest(selection: {
    proposedStartAt: string;
    proposedTimezone: string;
    reason?: string;
  }) {
    if (!modalBooking) return;

    try {
      setCreatingRequest(true);
      await createBookingRescheduleRequest(modalBooking.id, {
        proposedStartAt: selection.proposedStartAt,
        proposedTimezone: selection.proposedTimezone,
        reason: selection.reason,
      });
      Alert.alert('Solicitud enviada', 'La solicitud de reprogramación quedó pendiente.');
      closeRescheduleModal();
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudo crear la solicitud de reprogramación.'));
    } finally {
      setCreatingRequest(false);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    try {
      setProcessingRequestId(requestId);
      await acceptBookingRescheduleRequest(requestId);
      Alert.alert('Reprogramación aceptada', 'La cita fue reprogramada correctamente.');
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudo aceptar la reprogramación.'));
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      setProcessingRequestId(requestId);
      await rejectBookingRescheduleRequest(requestId);
      Alert.alert('Solicitud rechazada', 'La solicitud de reprogramación fue rechazada.');
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudo rechazar la reprogramación.'));
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleCancelRequest(requestId: string) {
    try {
      setProcessingRequestId(requestId);
      await cancelBookingRescheduleRequest(requestId);
      Alert.alert('Solicitud cancelada', 'La solicitud de reprogramación fue cancelada.');
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudo cancelar la reprogramación.'));
    } finally {
      setProcessingRequestId(null);
    }
  }

  const modalBookingSelection: BookingRescheduleModalBooking | null = modalBooking
    ? {
        professionalId: modalBooking.professionalId,
        sessionOfferingId: modalBooking.sessionOfferingId,
        scheduledStartAt: modalBooking.scheduledStartAt,
        scheduledEndAt: modalBooking.scheduledEndAt,
        timezone: modalBooking.timezone,
        sessionDurationMinutes: modalBooking.sessionOffering?.durationMinutes,
      }
    : null;

  return (
    <AppScreen scroll contentPadding={0}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mis reservas</Text>
          <Text style={styles.subtitle}>Gestiona tus reservas de sesiones</Text>
        </View>

        <AppCard>
          <Text style={styles.blockTitle}>Pendientes de pago: {pendingCount}</Text>
          <Text style={styles.muted}>Si una reserva expira, deberás crear una nueva.</Text>
        </AppCard>

        {loading ? (
          <View style={styles.stateWrap}>
            <Text style={styles.muted}>Cargando reservas...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.stateWrap}>
            <Ionicons name="calendar-clear-outline" size={44} color={appTheme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Aún no tienes reservas</Text>
            <Text style={styles.muted}>Reserva una sesión desde el perfil de un profesional.</Text>
          </View>
        ) : (
          bookings.map((booking) => {
            const requests = requestsByBookingId.get(booking.id) ?? [];
            const pendingRequest = requests.find((item) => item.status === 'PENDING') ?? null;
            const latestRequest = requests[0] ?? null;
            const canCreate = canCreateRescheduleRequest(booking, pendingRequest);
            const isPendingByMe = pendingRequest ? pendingRequest.requestedByUserId === user?.id : false;
            const isPendingByOther = pendingRequest ? pendingRequest.requestedByUserId !== user?.id : false;
            const requestHistory = requests.slice(1, 4);

            const amount = formatMoneyByCurrency(
              booking.currency === 'USD' ? booking.priceUsd : booking.priceBob,
              booking.currency,
              true,
            );

            return (
              <Pressable
                key={booking.id}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/(user)/bookings/payment/[bookingId]',
                    params: {
                      bookingId: booking.id,
                      professionalName:
                        `${booking.professional?.firstName ?? ''} ${booking.professional?.lastName ?? ''}`.trim() ||
                        booking.professional?.professionalProfile?.username ||
                        'Profesional',
                    },
                  } as any)
                }
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{booking.sessionOffering?.title ?? 'Sesión'}</Text>
                  <Text style={[styles.status, { color: statusColor(booking.status) }]}>
                    {statusLabel(booking.status)}
                  </Text>
                </View>

                <Text style={styles.meta}>{formatDateTime(booking.scheduledStartAt)}</Text>
                <Text style={styles.meta}>{amount}</Text>
                <Text style={styles.meta}>
                  {booking.professional?.firstName ?? ''} {booking.professional?.lastName ?? ''}
                </Text>

                <View style={styles.cardAction}>
                  <Text style={styles.cardActionText}>
                    {booking.status === 'PENDING_PAYMENT' ? 'Continuar pago' : 'Ver detalle'}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={appTheme.colors.primary} />
                </View>

                <View style={styles.rescheduleWrap}>
                  <Text style={styles.rescheduleTitle}>Reprogramar cita</Text>
                  <Text style={styles.rescheduleNotice}>
                    No hay devoluciones. El pago original se mantiene asociado a la cita.
                  </Text>

                  {latestRequest ? (
                    <View style={styles.requestStatusRow}>
                      <Text style={[styles.requestStatus, { color: getRequestStatusColor(latestRequest.status) }]}>
                        Estado: {getRequestStatusLabel(latestRequest.status)}
                      </Text>
                      <Text style={styles.requestMeta}>
                        Propuesta: {formatDateTime(latestRequest.proposedStartAt)}
                      </Text>
                    </View>
                  ) : null}

                  {requestHistory.length > 0 ? (
                    <View style={styles.requestHistoryWrap}>
                      {requestHistory.map((item) => (
                        <Text key={item.id} style={styles.requestHistoryItem}>
                          {getRequestStatusLabel(item.status)} · {formatDateTime(item.proposedStartAt)}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {pendingRequest ? (
                    isPendingByOther ? (
                      <View style={styles.rowActions}>
                        <AppButton
                          title={processingRequestId === pendingRequest.id ? 'Procesando...' : 'Aceptar reprogramación'}
                          onPress={() => void handleAcceptRequest(pendingRequest.id)}
                          loading={processingRequestId === pendingRequest.id}
                          disabled={processingRequestId !== null}
                        />
                        <AppButton
                          title="Rechazar reprogramación"
                          variant="secondary"
                          onPress={() => void handleRejectRequest(pendingRequest.id)}
                          disabled={processingRequestId !== null}
                        />
                      </View>
                    ) : isPendingByMe ? (
                      <AppButton
                        title={processingRequestId === pendingRequest.id ? 'Procesando...' : 'Cancelar solicitud'}
                        variant="secondary"
                        onPress={() => void handleCancelRequest(pendingRequest.id)}
                        loading={processingRequestId === pendingRequest.id}
                        disabled={processingRequestId !== null}
                      />
                    ) : null
                  ) : canCreate ? (
                    <AppButton
                      title="Solicitar reprogramación"
                      variant="secondary"
                      onPress={() => openRescheduleModal(booking)}
                    />
                  ) : (
                    <Text style={styles.requestMeta}>{getRescheduleBlockedMessage(booking)}</Text>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <BookingRescheduleModal
        visible={!!modalBooking}
        booking={modalBookingSelection}
        reasonValue={modalReason}
        onChangeReason={setModalReason}
        onCancel={closeRescheduleModal}
        onSubmit={(selection) => void handleSubmitRescheduleRequest(selection)}
        submitting={creatingRequest}
      />
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
    gap: 2,
  },
  title: {
    fontSize: 28,
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
  },
  muted: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: appTheme.fonts.heading,
    color: appTheme.colors.text,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: appTheme.fonts.heading,
    color: appTheme.colors.text,
  },
  status: {
    fontSize: 11,
    fontFamily: appTheme.fonts.body,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    color: '#475569',
    fontFamily: appTheme.fonts.body,
  },
  cardAction: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  cardActionText: {
    color: appTheme.colors.primary,
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: '700',
  },
  rescheduleWrap: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    gap: 6,
  },
  rescheduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  rescheduleNotice: {
    fontSize: 11,
    color: '#92400E',
    fontFamily: appTheme.fonts.body,
  },
  requestStatusRow: {
    gap: 2,
  },
  requestStatus: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: appTheme.fonts.body,
  },
  requestMeta: {
    fontSize: 12,
    color: '#334155',
    fontFamily: appTheme.fonts.body,
  },
  requestHistoryWrap: {
    marginTop: 2,
    gap: 2,
  },
  requestHistoryItem: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: appTheme.fonts.body,
  },
  rowActions: {
    gap: 8,
  },
});
