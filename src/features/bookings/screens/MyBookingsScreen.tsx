import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../../../components/ui/AppCard';
import AppScreen from '../../../components/ui/AppScreen';
import { appTheme } from '../../../theme/appTheme';
import { getMyBookings, type Booking } from '../../../api/bookings';
import { formatMoneyByCurrency } from '../../../utils/money';

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

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getMyBookings();
      const sorted = [...data].sort(
        (a, b) => new Date(b.scheduledStartAt).getTime() - new Date(a.scheduledStartAt).getTime(),
      );
      setBookings(sorted);
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
          <View style={styles.stateWrap}><Text style={styles.muted}>Cargando reservas...</Text></View>
        ) : bookings.length === 0 ? (
          <View style={styles.stateWrap}>
            <Ionicons name="calendar-clear-outline" size={44} color={appTheme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Aún no tienes reservas</Text>
            <Text style={styles.muted}>Reserva una sesión desde el perfil de un profesional.</Text>
          </View>
        ) : (
          bookings.map((booking) => {
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
              </Pressable>
            );
          })
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
});

