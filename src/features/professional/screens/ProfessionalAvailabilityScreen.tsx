import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppCard from '../../../components/ui/AppCard';
import AppScreen from '../../../components/ui/AppScreen';
import { appTheme } from '../../../theme/appTheme';
import {
  createAvailabilityRule,
  deleteAvailabilityRule,
  getAvailabilityRules,
  updateAvailabilityRule,
  type AvailabilityRule,
  type WeekDay,
} from '../../../api/sessionOfferings';

const WEEK_DAYS: WeekDay[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const WEEK_DAY_LABEL: Record<WeekDay, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

function isValidTime(text: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(text);
}

function parseTimeMinutes(text: string) {
  const [h, m] = text.split(':').map(Number);
  return h * 60 + m;
}

export default function ProfessionalAvailabilityScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [dayOfWeek, setDayOfWeek] = useState<WeekDay>('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAvailabilityRules();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar tus reglas de disponibilidad.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setDayOfWeek('MONDAY');
    setStartTime('09:00');
    setEndTime('17:00');
  }

  function startEdit(rule: AvailabilityRule) {
    setEditingId(rule.id);
    setDayOfWeek(rule.dayOfWeek);
    setStartTime(rule.startTime);
    setEndTime(rule.endTime);
  }

  async function handleSubmit() {
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      Alert.alert('Validación', 'Usa formato HH:mm en horas. Ej: 09:30');
      return;
    }

    if (parseTimeMinutes(startTime) >= parseTimeMinutes(endTime)) {
      Alert.alert('Validación', 'La hora de inicio debe ser menor a la hora final.');
      return;
    }

    try {
      setSaving(true);
      const payload = { dayOfWeek, startTime, endTime };

      if (editingId) {
        await updateAvailabilityRule(editingId, payload);
      } else {
        await createAvailabilityRule(payload);
      }

      resetForm();
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo guardar la regla.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAvailabilityRule(id);
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo eliminar/desactivar la regla.');
    }
  }

  const formTitle = useMemo(() => (editingId ? 'Editar regla de disponibilidad' : 'Nueva regla de disponibilidad'), [editingId]);

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
          <Text style={styles.title}>Disponibilidad</Text>
        </View>

        <AppCard>
          <Text style={styles.formTitle}>{formTitle}</Text>

          <Text style={styles.label}>Día de la semana</Text>
          <View style={styles.daysWrap}>
            {WEEK_DAYS.map((day) => {
              const active = dayOfWeek === day;
              return (
                <Pressable
                  key={day}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                  onPress={() => setDayOfWeek(day)}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{WEEK_DAY_LABEL[day]}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Hora inicio (HH:mm)</Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                style={styles.input}
                placeholder='09:00'
                placeholderTextColor={appTheme.colors.textMuted}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Hora fin (HH:mm)</Text>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                style={styles.input}
                placeholder='17:00'
                placeholderTextColor={appTheme.colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.formActions}>
            {editingId ? (
              <Pressable style={styles.secondaryBtn} onPress={resetForm}>
                <Text style={styles.secondaryBtnText}>Cancelar edición</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.primaryBtn, saving && styles.disabledBtn]}
              disabled={saving}
              onPress={() => void handleSubmit()}
            >
              <Text style={styles.primaryBtnText}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear regla'}</Text>
            </Pressable>
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.blockTitle}>Reglas actuales</Text>
          {loading ? (
            <Text style={styles.muted}>Cargando...</Text>
          ) : items.length === 0 ? (
            <Text style={styles.muted}>Aún no tienes reglas de disponibilidad.</Text>
          ) : (
            <View style={styles.list}>
              {items.map((rule) => (
                <View key={rule.id} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{WEEK_DAY_LABEL[rule.dayOfWeek]}</Text>
                  <Text style={styles.itemMeta}>{rule.startTime} - {rule.endTime}</Text>
                  <View style={styles.itemActions}>
                    <Pressable style={styles.actionBtn} onPress={() => startEdit(rule)}>
                      <Ionicons name='pencil-outline' size={14} color={appTheme.colors.primary} />
                      <Text style={[styles.actionText, { color: appTheme.colors.primary }]}>Editar</Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => void handleDelete(rule.id)}>
                      <Ionicons name='trash-outline' size={14} color='#991B1B' />
                      <Text style={[styles.actionText, { color: '#991B1B' }]}>Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
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
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#334155',
    fontFamily: appTheme.fonts.body,
    fontWeight: '600',
    marginTop: 6,
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  dayPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayPillActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  dayText: {
    color: '#334155',
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
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
  formActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  primaryBtn: {
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: appTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {
    color: '#334155',
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.65,
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
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  itemMeta: {
    fontSize: 12,
    color: '#334155',
    fontFamily: appTheme.fonts.body,
  },
  itemActions: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: '700',
  },
  muted: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
  },
});
