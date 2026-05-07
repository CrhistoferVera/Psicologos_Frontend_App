import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppCard from '../../../components/ui/AppCard';
import AppScreen from '../../../components/ui/AppScreen';
import { appTheme } from '../../../theme/appTheme';
import { getProfessionalBookings, type ProfessionalBooking } from '../../../api/sessionOfferings';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${time}`;
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

export default function ProfessionalBookingsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ProfessionalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getProfessionalBookings();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Error', 'No se pudo cargar tu agenda de reservas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime()),
    [items],
  );

  return (
    <AppScreen scroll contentPadding={0}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name='arrow-back' size={18} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.title}>Agenda / Reservas</Text>
        </View>

        <AppCard>
          <Text style={styles.blockTitle}>Próximas y recientes</Text>
          {loading ? (
            <Text style={styles.muted}>Cargando reservas...</Text>
          ) : sortedItems.length === 0 ? (
            <Text style={styles.muted}>Aún no tienes reservas registradas.</Text>
          ) : (
            <View style={styles.list}>
              {sortedItems.map((booking) => {
                const fullName = `${booking.client?.firstName ?? ''} ${booking.client?.lastName ?? ''}`.trim() || 'Cliente';
                const amount = booking.currency === 'USD'
                  ? `$ ${Number(booking.priceUsd).toFixed(2)} USD`
                  : `Bs ${Number(booking.priceBob).toFixed(2)} BOB`;

                return (
                  <View key={booking.id} style={styles.itemCard}>
                    <View style={styles.itemTop}>
                      <Text style={styles.itemTitle}>{booking.sessionOffering?.title ?? 'Sesión'}</Text>
                      <Text style={styles.status}>{statusLabel(booking.status)}</Text>
                    </View>
                    <Text style={styles.meta}>Cliente: {fullName}</Text>
                    <Text style={styles.meta}>Fecha/Hora: {formatDateTime(booking.scheduledStartAt)}</Text>
                    <Text style={styles.meta}>Monto: {amount}</Text>
                    <Text style={styles.meta}>Método: {booking.paymentMethod ?? '-'}</Text>
                    <Text style={styles.meta}>Moneda: {booking.currency}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </AppCard>
      </ScrollView>
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
  muted: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
});
