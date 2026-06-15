import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../../components/ui/AppButton';
import { type ImmediateAvailabilityStatus } from '../../../api/immediateAvailability';
import { appTheme } from '../../../theme/appTheme';

type Props = {
  availability: ImmediateAvailabilityStatus;
  nowMs: number;
  saving: boolean;
  onDeactivate: () => void;
};

function formatCountdown(expiresAt: string, nowMs: number): string {
  const remainingMs = new Date(expiresAt).getTime() - nowMs;
  if (remainingMs <= 0) return '00:00';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatCountdownLabel(expiresAt: string, nowMs: number): string {
  const remainingMs = new Date(expiresAt).getTime() - nowMs;
  if (remainingMs <= 0) return 'Expirado';
  const totalMinutes = Math.floor(remainingMs / 60000);
  if (totalMinutes >= 60) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h ${m}min restantes` : `${h}h restante${h > 1 ? 's' : ''}`;
  }
  return `${totalMinutes} min restantes`;
}

export default function ImmediateActiveCard({ availability, nowMs, saving, onDeactivate }: Props) {
  const countdown = availability.expiresAt ? formatCountdown(availability.expiresAt, nowMs) : '00:00';
  const countdownLabel = availability.expiresAt ? formatCountdownLabel(availability.expiresAt, nowMs) : '';

  return (
    <View style={styles.wrapper}>
      {/* Header verde: estado activo */}
      <View style={styles.header}>
        {/* Fila superior: badge activo + ícono flash */}
        <View style={styles.headerTopRow}>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>EN LÍNEA AHORA</Text>
          </View>
          <View style={styles.flashBadge}>
            <Ionicons name="flash" size={15} color="#DC2626" />
          </View>
        </View>

        {/* Título principal */}
        <Text style={styles.headerTitle}>Estás disponible{'\n'}para atención inmediata</Text>

        {/* Fila inferior: avatar placeholder + texto */}
        <View style={styles.headerFooter}>
          <Ionicons name="people-outline" size={14} color="#166534" />
          <Text style={styles.headerSub}>Los clientes pueden encontrarte en este momento</Text>
        </View>
      </View>

      {/* Detalles de la sesión */}
      <View style={styles.detailsRow}>
        <View style={styles.detailCard}>
          <View style={styles.detailIconWrap}>
            <Ionicons name="cash-outline" size={16} color={appTheme.colors.primary} />
          </View>
          <Text style={styles.detailValue}>Bs. {availability.priceBob}</Text>
          <Text style={styles.detailLabel}>por sesión</Text>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailCard}>
          <View style={styles.detailIconWrap}>
            <Ionicons name="time-outline" size={16} color={appTheme.colors.primary} />
          </View>
          <Text style={styles.detailValue}>{availability.durationMinutes} min</Text>
          <Text style={styles.detailLabel}>duración</Text>
        </View>
      </View>

      {/* Descripción */}
      {availability.description ? (
        <View style={styles.descriptionWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={13} color={appTheme.colors.textMuted} />
          <Text style={styles.descriptionText}>{availability.description}</Text>
        </View>
      ) : null}

      {/* Countdown */}
      <View style={styles.countdownCard}>
        <Text style={styles.countdownLabel}>Tiempo restante</Text>
        <Text style={styles.countdown}>{countdown}</Text>
        <Text style={styles.countdownSub}>{countdownLabel}</Text>
      </View>

      {/* Botón desactivar */}
      <AppButton
        title="Desactivar atención inmediata"
        variant="secondary"
        onPress={onDeactivate}
        loading={saving}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  header: {
    backgroundColor: '#F0FDF4',
    borderRadius: appTheme.radius.lg,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 18,
    gap: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#16A34A',
  },
  activeBadgeText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.8,
  },
  flashBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFE4E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    color: '#14532D',
    lineHeight: 26,
  },
  headerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerSub: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    overflow: 'hidden',
  },
  detailCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  detailDivider: {
    width: 1,
    backgroundColor: appTheme.colors.border,
    marginVertical: 12,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    color: appTheme.colors.text,
  },
  detailLabel: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    color: appTheme.colors.textMuted,
  },
  descriptionWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 12,
  },
  descriptionText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  countdownCard: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: appTheme.radius.lg,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 2,
  },
  countdownLabel: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  countdown: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 52,
    color: '#FFFFFF',
    letterSpacing: 4,
    lineHeight: 62,
  },
  countdownSub: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  btn: {
    marginTop: 4,
  },
});
