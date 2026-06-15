import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../../components/ui/AppButton';
import AppCard from '../../../components/ui/AppCard';
import { appTheme } from '../../../theme/appTheme';

const QUICK_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '2 horas', value: 120 },
];

type Props = {
  priceBob: string;
  durationMinutes: string;
  activeForMinutes: number;
  activeForMinutesCustom: string;
  isCustomTime: boolean;
  description: string;
  saving: boolean;
  onChangePriceBob: (v: string) => void;
  onChangeDurationMinutes: (v: string) => void;
  onSelectQuickTime: (v: number) => void;
  onChangeCustomTime: (v: string) => void;
  onToggleCustomTime: () => void;
  onChangeDescription: (v: string) => void;
  onActivate: () => void;
};

export default function ImmediateActivateForm({
  priceBob,
  durationMinutes,
  activeForMinutes,
  activeForMinutesCustom,
  isCustomTime,
  description,
  saving,
  onChangePriceBob,
  onChangeDurationMinutes,
  onSelectQuickTime,
  onChangeCustomTime,
  onToggleCustomTime,
  onChangeDescription,
  onActivate,
}: Props) {
  return (
    <View style={styles.wrapper}>

      {/* Banner informativo */}
      <View style={styles.infoBanner}>
        <View style={styles.infoBannerIcon}>
          <Ionicons name="flash" size={18} color="#DC2626" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoBannerTitle}>¿Cómo funciona?</Text>
          <Text style={styles.infoBannerDesc}>
            Al activarte, los clientes podrán verte disponible ahora mismo y reservar contigo al instante.
          </Text>
        </View>
      </View>

      {/* Sección: Precio y Duración */}
      <AppCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name="settings-outline" size={15} color={appTheme.colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Configuración de la sesión</Text>
        </View>

        <View style={styles.row}>
          {/* Precio */}
          <View style={styles.col}>
            <Text style={styles.label}>Precio</Text>
            <View style={styles.inputWrap}>
              <View style={styles.inputBadge}>
                <Text style={styles.inputBadgeText}>Bs.</Text>
              </View>
              <TextInput
                value={priceBob}
                onChangeText={onChangePriceBob}
                keyboardType="numeric"
                style={styles.input}
                placeholder="150"
                placeholderTextColor={appTheme.colors.textMuted}
              />
            </View>
          </View>

          {/* Duración */}
          <View style={styles.col}>
            <Text style={styles.label}>Duración</Text>
            <View style={styles.inputWrap}>
              <View style={styles.inputBadge}>
                <Ionicons name="time-outline" size={13} color={appTheme.colors.primary} />
              </View>
              <TextInput
                value={durationMinutes}
                onChangeText={onChangeDurationMinutes}
                keyboardType="numeric"
                style={styles.input}
                placeholder="30"
                placeholderTextColor={appTheme.colors.textMuted}
              />
              <Text style={styles.inputSuffix}>min</Text>
            </View>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.divider} />

        {/* Descripción */}
        <Text style={styles.label}>Descripción <Text style={styles.labelOptional}>(opcional)</Text></Text>
        <View style={styles.textareaWrap}>
          <TextInput
            value={description}
            onChangeText={onChangeDescription}
            style={styles.textarea}
            multiline
            numberOfLines={3}
            placeholder="Ej: Disponible para crisis de ansiedad o estrés agudo..."
            placeholderTextColor={appTheme.colors.textMuted}
            autoCapitalize="sentences"
            textAlignVertical="top"
          />
        </View>
      </AppCard>

      {/* Sección: Tiempo activo */}
      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Tiempo activo</Text>
        <Text style={styles.sectionSubtitle}>¿Cuánto tiempo estarás disponible?</Text>

        {/* Opciones rápidas */}
        <View style={styles.quickRow}>
          {QUICK_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => { onSelectQuickTime(opt.value); if (isCustomTime) onToggleCustomTime(); }}
              style={[
                styles.chip,
                !isCustomTime && activeForMinutes === opt.value && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  !isCustomTime && activeForMinutes === opt.value && styles.chipTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}

          {/* Chip personalizado */}
          <Pressable
            onPress={onToggleCustomTime}
            style={[styles.chip, isCustomTime && styles.chipSelected]}
          >
            <Ionicons
              name="create-outline"
              size={13}
              color={isCustomTime ? appTheme.colors.primary : appTheme.colors.textMuted}
            />
            <Text style={[styles.chipText, isCustomTime && styles.chipTextSelected]}>
              Otro
            </Text>
          </Pressable>
        </View>

        {/* Input manual */}
        {isCustomTime ? (
          <View style={styles.customTimeWrap}>
            <View style={styles.inputWrap}>
              <TextInput
                value={activeForMinutesCustom}
                onChangeText={onChangeCustomTime}
                keyboardType="numeric"
                style={styles.input}
                placeholder="Ej: 45"
                placeholderTextColor={appTheme.colors.textMuted}
                autoFocus
              />
              <Text style={styles.inputSuffix}>minutos</Text>
            </View>
            <Text style={styles.customTimeHint}>Ingresa cuántos minutos estarás activo</Text>
          </View>
        ) : null}
      </AppCard>

      {/* Botón activar */}
      <AppButton
        title="Activar atención inmediata"
        onPress={onActivate}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFF8F8',
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
  },
  infoBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFE4E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerTitle: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '700',
    marginBottom: 2,
  },
  infoBannerDesc: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    color: appTheme.colors.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: appTheme.colors.border,
    marginVertical: 2,
  },
  labelOptional: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    color: appTheme.colors.textMuted,
    fontWeight: '400',
  },
  inputBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBadgeText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    color: appTheme.colors.primary,
    fontWeight: '600',
  },
  textareaWrap: {
    backgroundColor: '#F8FAFF',
    borderRadius: appTheme.radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
  },
  textarea: {
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    color: appTheme.colors.text,
    minHeight: 60,
  },
  sectionSubtitle: {
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    color: appTheme.colors.textMuted,
    marginTop: -6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: '600',
    color: appTheme.colors.text,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: appTheme.radius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 46,
    paddingHorizontal: 12,
    gap: 6,
  },
  inputPrefix: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  inputSuffix: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  input: {
    flex: 1,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    color: appTheme.colors.text,
    paddingVertical: 10,
  },
  _unusedTextarea: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: appTheme.radius.md,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: appTheme.colors.surface,
  },
  chipSelected: {
    borderColor: appTheme.colors.primary,
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  chipTextSelected: {
    color: appTheme.colors.primary,
    fontWeight: '600',
  },
  customTimeWrap: {
    gap: 6,
  },
  customTimeHint: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    color: appTheme.colors.textMuted,
    marginLeft: 2,
  },
  btn: {
    marginTop: 4,
  },
});
