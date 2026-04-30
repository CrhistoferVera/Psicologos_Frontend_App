import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import AppScreen from "../../../components/ui/AppScreen";
import { ADMIN_WEB_URL } from "../../../config";
import { appTheme } from "../../../theme/appTheme";

const MESSAGE =
  "Esta cuenta es de administrador. Usa el panel web de SanaMente para gestionar la plataforma.";

export default function AdminMobileNoticeScreen() {
  const router = useRouter();
  const hasAdminWebUrl = ADMIN_WEB_URL.trim().length > 0;

  async function handleOpenWebPanel() {
    if (!hasAdminWebUrl) return;
    try {
      await Linking.openURL(ADMIN_WEB_URL);
    } catch {
      Alert.alert("No se pudo abrir el panel", "Verifica la URL del panel web de administracion.");
    }
  }

  return (
    <AppScreen contentPadding={0}>
      <View style={styles.page}>
        <View style={styles.card}>
          <Text style={styles.title}>Acceso de administrador</Text>
          <Text style={styles.message}>{MESSAGE}</Text>

          {hasAdminWebUrl ? (
            <Pressable style={styles.primaryButton} onPress={handleOpenWebPanel}>
              <Text style={styles.primaryButtonText}>Abrir panel web</Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.secondaryButton} onPress={() => router.replace("/(public)/auth")}>
            <Text style={styles.secondaryButtonText}>Volver al login</Text>
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    backgroundColor: appTheme.colors.background,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    padding: 18,
    gap: 14,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 22,
    fontWeight: "700",
  },
  message: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.primary,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "600",
  },
});

