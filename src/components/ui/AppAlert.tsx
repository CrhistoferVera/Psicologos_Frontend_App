import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme/appTheme";

type AlertType = "error" | "warning" | "success" | "info";

interface Props {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
}

const config: Record<AlertType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; lightBg: string }> = {
  error:   { icon: "close-circle",       color: "#DC2626", bg: "#FEE2E2", lightBg: "#FFF5F5" },
  warning: { icon: "warning",            color: "#D97706", bg: "#FEF3C7", lightBg: "#FFFBEB" },
  success: { icon: "checkmark-circle",   color: "#16A34A", bg: "#DCFCE7", lightBg: "#F0FDF4" },
  info:    { icon: "information-circle", color: "#1976D2", bg: "#DBEAFE", lightBg: "#EFF6FF" },
};

export default function AppAlert({
  visible,
  type = "error",
  title,
  message,
  confirmText = "Entendido",
  onConfirm,
}: Props) {
  const { icon, color, bg, lightBg } = config[type];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
      <View style={styles.backdrop}>
        <View style={styles.container}>

          {/* Ícono */}
          <View style={[styles.iconWrap, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={36} color={color} />
          </View>

          {/* Contenido */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Botón */}
          <Pressable
            style={[styles.btn, { backgroundColor: color }]}
            onPress={onConfirm}
          >
            <Text style={styles.btnText}>{confirmText}</Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  btn: {
    width: "100%",
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
});
