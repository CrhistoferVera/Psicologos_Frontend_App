import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppCard from '../../../components/ui/AppCard';
import AppScreen from '../../../components/ui/AppScreen';
import { appTheme } from '../../../theme/appTheme';
import {
  createSessionOffering,
  getMySessionOfferings,
  updateSessionOffering,
  updateSessionOfferingStatus,
  type SessionOffering,
} from '../../../api/sessionOfferings';

function formatMoney(value?: number) {
  return Number(value ?? 0).toFixed(2);
}

export default function ProfessionalSessionOfferingsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<SessionOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [priceBob, setPriceBob] = useState('200');

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getMySessionOfferings();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar tus sesiones ofrecidas.');
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
    setTitle('');
    setDescription('');
    setDurationMinutes('45');
    setPriceBob('200');
  }

  function startEdit(item: SessionOffering) {
    setEditingId(item.id);
    setTitle(item.title ?? '');
    setDescription(item.description ?? '');
    setDurationMinutes(String(item.durationMinutes ?? ''));
    setPriceBob(String(item.priceBob ?? ''));
  }

  async function handleSubmit() {
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const duration = Number(durationMinutes);
    const price = Number(priceBob);

    if (!normalizedTitle) {
      Alert.alert('Validación', 'Ingresa un título.');
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      Alert.alert('Validación', 'La duración debe ser mayor a 0 minutos.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Validación', 'El precio en Bs debe ser mayor a 0.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: normalizedTitle,
        description: normalizedDescription || undefined,
        durationMinutes: duration,
        priceBob: price,
      };

      if (editingId) {
        await updateSessionOffering(editingId, payload);
      } else {
        await createSessionOffering(payload);
      }

      resetForm();
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo guardar la sesión ofrecida.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(item: SessionOffering) {
    try {
      await updateSessionOfferingStatus(item.id, !item.isActive);
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo actualizar el estado.');
    }
  }

  const formTitle = useMemo(() => (editingId ? 'Editar sesión ofrecida' : 'Nueva sesión ofrecida'), [editingId]);

  return (
    <AppScreen scroll contentPadding={0}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Mis sesiones</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.linkBtn} onPress={() => router.push('/(professional)/availability' as any)}>
              <Text style={styles.linkBtnText}>Disponibilidad</Text>
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={() => router.push('/(professional)/bookings' as any)}>
              <Text style={styles.linkBtnText}>Agenda</Text>
            </Pressable>
          </View>
        </View>

        <AppCard>
          <Text style={styles.formTitle}>{formTitle}</Text>

          <Text style={styles.label}>Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder='Ej: Sesión individual'
            placeholderTextColor={appTheme.colors.textMuted}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.textarea]}
            multiline
            placeholder='Ej: Sesión de seguimiento individual'
            placeholderTextColor={appTheme.colors.textMuted}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Duración (min)</Text>
              <TextInput
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType='numeric'
                style={styles.input}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Precio Bs</Text>
              <TextInput
                value={priceBob}
                onChangeText={setPriceBob}
                keyboardType='numeric'
                style={styles.input}
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
              <Text style={styles.primaryBtnText}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear sesión'}</Text>
            </Pressable>
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.blockTitle}>Sesiones ofrecidas</Text>
          {loading ? (
            <Text style={styles.muted}>Cargando...</Text>
          ) : items.length === 0 ? (
            <Text style={styles.muted}>Aún no tienes sesiones ofrecidas registradas.</Text>
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                    </View>
                    <View style={[styles.statusPill, item.isActive ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusText, item.isActive ? styles.statusActiveText : styles.statusInactiveText]}>
                        {item.isActive ? 'Activa' : 'Inactiva'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>Duración: {item.durationMinutes} min</Text>
                    <Text style={styles.meta}>Bs {formatMoney(item.priceBob)}</Text>
                    <Text style={styles.meta}>USD {formatMoney(item.priceUsd)}</Text>
                  </View>

                  <View style={styles.itemActions}>
                    <Pressable style={styles.actionBtn} onPress={() => startEdit(item)}>
                      <Ionicons name='pencil-outline' size={14} color={appTheme.colors.primary} />
                      <Text style={[styles.actionText, { color: appTheme.colors.primary }]}>Editar</Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => void handleToggleStatus(item)}>
                      <Ionicons
                        name={item.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                        size={14}
                        color={item.isActive ? '#991B1B' : '#166534'}
                      />
                      <Text style={[styles.actionText, { color: item.isActive ? '#991B1B' : '#166534' }]}>
                        {item.isActive ? 'Desactivar' : 'Activar'}
                      </Text>
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
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
  },
  linkBtn: {
    backgroundColor: '#EAF0FF',
    borderWidth: 1,
    borderColor: '#D6E3FA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  linkBtnText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontWeight: '700',
    fontSize: 12,
  },
  formTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#334155',
    fontFamily: appTheme.fonts.body,
    fontWeight: '600',
    marginTop: 6,
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
  textarea: {
    minHeight: 78,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
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
    gap: 8,
  },
  itemTop: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  itemDescription: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
    fontFamily: appTheme.fonts.body,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: appTheme.fonts.body,
  },
  statusActiveText: {
    color: '#166534',
  },
  statusInactiveText: {
    color: '#475569',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  meta: {
    fontSize: 12,
    color: '#334155',
    fontFamily: appTheme.fonts.body,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 14,
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
