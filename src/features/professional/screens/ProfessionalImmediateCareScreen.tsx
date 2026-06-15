import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppScreen from '../../../components/ui/AppScreen';
import {
  deactivateImmediateAvailability,
  getMyImmediateAvailability,
  setImmediateAvailability,
  type ImmediateAvailabilityStatus,
} from '../../../api/immediateAvailability';
import { appTheme } from '../../../theme/appTheme';
import ImmediateActiveCard from '../components/ImmediateActiveCard';
import ImmediateActivateForm from '../components/ImmediateActivateForm';
import DeactivateImmediateModal from '../components/DeactivateImmediateModal';

export default function ProfessionalImmediateCareScreen() {
  const router = useRouter();
  const [availability, setAvailability] = useState<ImmediateAvailabilityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const [priceBob, setPriceBob] = useState('150');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [activeForMinutes, setActiveForMinutes] = useState(60);
  const [activeForMinutesCustom, setActiveForMinutesCustom] = useState('');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [description, setDescription] = useState('');

  const [nowMs, setNowMs] = useState(Date.now());
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (availability?.isActive && availability.expiresAt) {
      countdownRef.current = setInterval(() => setNowMs(Date.now()), 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [availability?.isActive, availability?.expiresAt]);

  async function load() {
    try {
      const data = await getMyImmediateAvailability();
      setAvailability(data);
      if (data.isActive) {
        if (data.priceBob) setPriceBob(String(data.priceBob));
        if (data.durationMinutes) setDurationMinutes(String(data.durationMinutes));
        if (data.description) setDescription(data.description ?? '');
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar el estado de atención inmediata.');
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate() {
    const price = parseFloat(priceBob);
    const duration = parseInt(durationMinutes, 10);
    const resolvedActiveFor = isCustomTime
      ? parseInt(activeForMinutesCustom, 10)
      : activeForMinutes;

    if (!price || price <= 0) return Alert.alert('Error', 'Ingresa un precio válido.');
    if (!duration || duration <= 0) return Alert.alert('Error', 'Ingresa una duración válida.');
    if (!resolvedActiveFor || resolvedActiveFor <= 0) return Alert.alert('Error', 'Ingresa un tiempo activo válido.');

    setSaving(true);
    try {
      const result = await setImmediateAvailability({
        priceBob: price,
        durationMinutes: duration,
        activeForMinutes: resolvedActiveFor,
        description: description.trim() || undefined,
      });
      setAvailability(result);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo activar la atención inmediata.');
    } finally {
      setSaving(false);
    }
  }

  function handleDeactivate() {
    setShowDeactivateModal(true);
  }

  async function confirmDeactivate() {
    setSaving(true);
    try {
      await deactivateImmediateAvailability();
      setAvailability({ isActive: false });
      setShowDeactivateModal(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo desactivar.');
    } finally {
      setSaving(false);
    }
  }

  const isExpired =
    availability?.isActive &&
    availability.expiresAt &&
    new Date(availability.expiresAt).getTime() <= nowMs;

  const isActive = availability?.isActive && !isExpired;

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Atención Inmediata</Text>
        </View>
        <Text style={styles.muted}>Cargando...</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <DeactivateImmediateModal
        visible={showDeactivateModal}
        loading={saving}
        onConfirm={confirmDeactivate}
        onClose={() => setShowDeactivateModal(false)}
      />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={appTheme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Atención Inmediata</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isActive && availability ? (
          <ImmediateActiveCard
            availability={availability}
            nowMs={nowMs}
            saving={saving}
            onDeactivate={handleDeactivate}
          />
        ) : (
          <ImmediateActivateForm
            priceBob={priceBob}
            durationMinutes={durationMinutes}
            activeForMinutes={activeForMinutes}
            activeForMinutesCustom={activeForMinutesCustom}
            isCustomTime={isCustomTime}
            description={description}
            saving={saving}
            onChangePriceBob={setPriceBob}
            onChangeDurationMinutes={setDurationMinutes}
            onSelectQuickTime={setActiveForMinutes}
            onChangeCustomTime={setActiveForMinutesCustom}
            onToggleCustomTime={() => setIsCustomTime((v) => !v)}
            onChangeDescription={setDescription}
            onActivate={handleActivate}
          />
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 0,
    marginTop: -6,
    paddingBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: '700',
    fontSize: 22,
  },
  container: {
    paddingHorizontal: 6,
    paddingVertical: appTheme.spacing.md,
    paddingBottom: 40,
  },
  muted: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    padding: appTheme.spacing.md,
  },
});
