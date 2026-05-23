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
  rejectBookingRescheduleRequest,
  type BookingRescheduleRequest,
  type BookingRescheduleRequestStatus,
} from '../../../api/bookings';
import { getMyChats } from '../../../api/messages';
import { getProfessionalBookings, type ProfessionalBooking } from '../../../api/sessionOfferings';
import BookingRescheduleModal, {
  type BookingRescheduleModalBooking,
} from '../../bookings/components/BookingRescheduleModal';
import { useAuth } from '../../../context/AuthContext';
import { appTheme } from '../../../theme/appTheme';
import { formatMoneyByCurrency } from '../../../utils/money';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${time}`;
}

function formatHour(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function statusLabel(status: string) {
  if (status === 'PENDING_PAYMENT') return 'Pendiente de pago';
  if (status === 'CONFIRMED') return 'Confirmada';
  if (status === 'EXPIRED') return 'Expirada';
  if (status === 'CANCELLED_BY_CLIENT') return 'Cancelada por cliente';
  if (status === 'CANCELLED_BY_PROFESSIONAL') return 'Cancelada por profesional';
  if (status === 'COMPLETED') return 'Completada';
  if (status === 'NO_SHOW') return 'No asistida';
  return status;
}

function isCommunicationActive(booking: ProfessionalBooking, now = new Date()) {
  if (booking.status !== 'CONFIRMED') return false;
  if (booking.paymentStatus !== 'PAID') return false;
  const start = new Date(booking.scheduledStartAt);
  const end = new Date(booking.scheduledEndAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return now >= start && now <= end;
}

function getCommunicationStateLabel(booking: ProfessionalBooking, now = new Date()) {
  const start = new Date(booking.scheduledStartAt);
  const end = new Date(booking.scheduledEndAt);

  if (booking.paymentStatus !== 'PAID') {
    return 'Comunicacion bloqueada: pago pendiente.';
  }

  if (booking.status !== 'CONFIRMED') {
    return 'Comunicacion bloqueada: reserva no confirmada.';
  }

  if (now < start) {
    return `Disponible desde ${formatDateTime(booking.scheduledStartAt)}.`;
  }

  if (now > end) {
    return `Sesion finalizada a las ${formatHour(booking.scheduledEndAt)}.`;
  }

  return `Sesion activa hasta ${formatHour(booking.scheduledEndAt)}.`;
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

function sortRequestsByNewest(requests: BookingRescheduleRequest[]) {
  return [...requests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function isAtLeast24HoursAhead(isoDate: string, now = new Date()) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > now.getTime() + 24 * 60 * 60 * 1000;
}

function canCreateRescheduleRequest(
  booking: ProfessionalBooking,
  pendingRequest: BookingRescheduleRequest | null,
) {
  if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') return false;
  if (pendingRequest) return false;
  return isAtLeast24HoursAhead(booking.scheduledStartAt);
}

function getRescheduleBlockedMessage(booking: ProfessionalBooking) {
  if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
    return 'Disponible solo para citas confirmadas y pagadas.';
  }
  if (!isAtLeast24HoursAhead(booking.scheduledStartAt)) {
    return 'Solo puedes reprogramar con al menos 24 horas de anticipacion.';
  }
  return 'No se puede solicitar reprogramacion para esta cita.';
}

function getApiErrorMessage(err: any, fallback: string) {
  const raw = err?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join('\n');
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}

export default function ProfessionalBookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ProfessionalBooking[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<BookingRescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingChatBookingId, setOpeningChatBookingId] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [modalBooking, setModalBooking] = useState<ProfessionalBooking | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [creatingRequest, setCreatingRequest] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [bookingRows, requestRows] = await Promise.all([
        getProfessionalBookings(),
        getMyBookingRescheduleRequests(),
      ]);
      setItems(Array.isArray(bookingRows) ? bookingRows : []);
      setRescheduleRequests(Array.isArray(requestRows) ? requestRows : []);
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudo cargar tu agenda de reservas.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime(),
      ),
    [items],
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

  function openRescheduleModal(booking: ProfessionalBooking) {
    if (!booking.professionalId || !booking.sessionOfferingId) {
      Alert.alert('No disponible', 'No se pudo identificar la sesion para reprogramar.');
      return;
    }
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
      Alert.alert('Solicitud enviada', 'La solicitud de reprogramacion quedo pendiente.');
      closeRescheduleModal();
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudo crear la solicitud de reprogramacion.'));
    } finally {
      setCreatingRequest(false);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    try {
      setProcessingRequestId(requestId);
      await acceptBookingRescheduleRequest(requestId);
      Alert.alert('Reprogramacion aceptada', 'La cita fue reprogramada correctamente.');
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudo aceptar la reprogramacion.'));
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      setProcessingRequestId(requestId);
      await rejectBookingRescheduleRequest(requestId);
      Alert.alert('Solicitud rechazada', 'La solicitud de reprogramacion fue rechazada.');
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudo rechazar la reprogramacion.'));
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleCancelRequest(requestId: string) {
    try {
      setProcessingRequestId(requestId);
      await cancelBookingRescheduleRequest(requestId);
      Alert.alert('Solicitud cancelada', 'La solicitud de reprogramacion fue cancelada.');
      await load(true);
    } catch (err: any) {
      Alert.alert('Error', getApiErrorMessage(err, 'No se pudo cancelar la reprogramacion.'));
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleOpenChat(booking: ProfessionalBooking) {
    if (openingChatBookingId) return;
    const clientId = booking.client?.id;
    if (!clientId) {
      Alert.alert('No disponible', 'No se encontro el cliente para esta reserva.');
      return;
    }

    try {
      setOpeningChatBookingId(booking.id);
      const chats = await getMyChats();
      const existing = chats.find((chat) => chat.otherUserId === clientId);

      router.push({
        pathname: '/(professional)/messages/[id]',
        params: {
          id: existing?.conversationId ?? '',
          clientId,
          clientName: `${booking.client?.firstName ?? ''} ${booking.client?.lastName ?? ''}`.trim() || 'Cliente',
          clientAvatar: '',
        },
      } as any);
    } catch {
      router.push({
        pathname: '/(professional)/messages/[id]',
        params: {
          id: '',
          clientId,
          clientName: `${booking.client?.firstName ?? ''} ${booking.client?.lastName ?? ''}`.trim() || 'Cliente',
          clientAvatar: '',
        },
      } as any);
    } finally {
      setOpeningChatBookingId(null);
    }
  }

  const modalBookingSelection: BookingRescheduleModalBooking | null = modalBooking
    ? {
        professionalId: modalBooking.professionalId ?? '',
        sessionOfferingId: modalBooking.sessionOfferingId ?? '',
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
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.title}>Agenda / Reservas</Text>
        </View>

        <AppCard>
          <Text style={styles.blockTitle}>Proximas y recientes</Text>
          {loading ? (
            <Text style={styles.muted}>Cargando reservas...</Text>
          ) : sortedItems.length === 0 ? (
            <Text style={styles.muted}>Aun no tienes reservas registradas.</Text>
          ) : (
            <View style={styles.list}>
              {sortedItems.map((booking) => {
                const requests = requestsByBookingId.get(booking.id) ?? [];
                const pendingRequest = requests.find((item) => item.status === 'PENDING') ?? null;
                const latestRequest = requests[0] ?? null;
                const canCreate = canCreateRescheduleRequest(booking, pendingRequest);
                const isPendingByMe = pendingRequest ? pendingRequest.requestedByUserId === user?.id : false;
                const isPendingByOther = pendingRequest ? pendingRequest.requestedByUserId !== user?.id : false;
                const requestHistory = requests.slice(1, 4);

                const fullName =
                  `${booking.client?.firstName ?? ''} ${booking.client?.lastName ?? ''}`.trim() || 'Cliente';
                const amount = formatMoneyByCurrency(
                  booking.currency === 'USD' ? booking.priceUsd : booking.priceBob,
                  booking.currency === 'USD' ? 'USD' : 'BOB',
                  true,
                );

                const activeNow = isCommunicationActive(booking);

                return (
                  <View key={booking.id} style={styles.itemCard}>
                    <View style={styles.itemTop}>
                      <Text style={styles.itemTitle}>{booking.sessionOffering?.title ?? 'Sesion'}</Text>
                      <Text style={styles.status}>{statusLabel(booking.status)}</Text>
                    </View>
                    <Text style={styles.meta}>Cliente: {fullName}</Text>
                    <Text style={styles.meta}>Fecha/Hora: {formatDateTime(booking.scheduledStartAt)}</Text>
                    <Text style={styles.meta}>Monto: {amount}</Text>
                    <Text style={styles.meta}>Metodo: {booking.paymentMethod ?? '-'}</Text>
                    <Text style={styles.meta}>Moneda: {booking.currency}</Text>

                    <Text style={[styles.commLabel, activeNow && styles.commLabelActive]}>
                      {getCommunicationStateLabel(booking)}
                    </Text>
                    {activeNow ? (
                      <Text style={styles.callWaitHint}>
                        Espera a que el cliente inicie la llamada o videollamada.
                      </Text>
                    ) : null}

                    <View style={styles.actionsRow}>
                      <Pressable
                        style={[styles.actionBtn, !activeNow && styles.actionBtnDisabled]}
                        onPress={() => void handleOpenChat(booking)}
                        disabled={!activeNow || openingChatBookingId !== null}
                      >
                        <Text style={styles.actionBtnText}>
                          {openingChatBookingId === booking.id ? 'Abriendo...' : 'Abrir chat'}
                        </Text>
                      </Pressable>
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
                              title={processingRequestId === pendingRequest.id ? 'Procesando...' : 'Aceptar reprogramacion'}
                              onPress={() => void handleAcceptRequest(pendingRequest.id)}
                              loading={processingRequestId === pendingRequest.id}
                              disabled={processingRequestId !== null}
                            />
                            <AppButton
                              title="Rechazar reprogramacion"
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
                          title="Solicitar reprogramacion"
                          variant="secondary"
                          onPress={() => openRescheduleModal(booking)}
                        />
                      ) : (
                        <Text style={styles.requestMeta}>{getRescheduleBlockedMessage(booking)}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </AppCard>
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
    padding: 14,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: appTheme.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    marginBottom: 6,
  },
  list: {
    gap: 10,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 4,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  status: {
    fontSize: 11,
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    color: '#334155',
    fontFamily: appTheme.fonts.body,
  },
  commLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#92400E',
    fontFamily: appTheme.fonts.body,
    fontWeight: '600',
  },
  commLabelActive: {
    color: '#166534',
  },
  callWaitHint: {
    marginTop: 2,
    fontSize: 12,
    color: '#166534',
    fontFamily: appTheme.fonts.body,
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    borderRadius: 10,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
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
  muted: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
});
