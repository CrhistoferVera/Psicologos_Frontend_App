import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppCard from '../../../components/ui/AppCard';
import AppScreen from '../../../components/ui/AppScreen';
import { appTheme } from '../../../theme/appTheme';

export default function LegacySessionsDeprecatedScreen() {
  const router = useRouter();

  return (
    <AppScreen contentPadding={0}>
      <View style={styles.page}>
        <AppCard style={styles.card}>
          <Ionicons name='information-circle-outline' size={34} color={appTheme.colors.primary} />
          <Text style={styles.title}>Flujo reemplazado</Text>
          <Text style={styles.message}>
            Este flujo fue reemplazado por reservas con fecha y hora.
          </Text>

          <Pressable style={styles.primaryBtn} onPress={() => router.replace('/(user)/bookings' as any)}>
            <Text style={styles.primaryBtnText}>Ir a mis reservas</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/(user)/professionals' as any)}>
            <Text style={styles.secondaryBtnText}>Buscar psicólogos</Text>
          </Pressable>
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: appTheme.colors.background,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 22,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 6,
    minHeight: 44,
    width: '100%',
    borderRadius: 12,
    backgroundColor: appTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: appTheme.fonts.body,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    minHeight: 44,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#334155',
    fontFamily: appTheme.fonts.body,
    fontWeight: '700',
    fontSize: 14,
  },
});
