import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appTheme } from '../../../theme/appTheme';

type Props = {
  visible: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function DeactivateImmediateModal({ visible, loading, onConfirm, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Ícono central */}
          <View style={styles.iconWrap}>
            <Ionicons name="flash-off" size={28} color="#DC2626" />
          </View>

          {/* Título y descripción */}
          <Text style={styles.title}>¿Desactivar atención inmediata?</Text>
          <Text style={styles.description}>
            Los clientes dejarán de verte como disponible ahora mismo. Podrás volver a activarla cuando quieras.
          </Text>

          {/* Botones */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash-off" size={15} color="#FFFFFF" />
                  <Text style={styles.confirmText}>Sí, desactivar</Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
  },
  title: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    color: appTheme.colors.text,
    textAlign: 'center',
  },
  description: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    color: appTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: appTheme.radius.md,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    alignItems: 'center',
    backgroundColor: appTheme.colors.surface,
  },
  cancelText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.colors.text,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: appTheme.radius.md,
    backgroundColor: '#DC2626',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
