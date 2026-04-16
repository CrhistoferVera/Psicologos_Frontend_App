import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../src/theme/appTheme";

export default function ClientCallWebFallback() {
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Llamadas no disponibles en web</Text>
        <Text style={styles.message}>
          El MVP web prioriza chat y gestion de creditos. Usa la app movil para llamadas de audio/video.
        </Text>
        <Link href="/(user)/chats" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Volver a chats</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: appTheme.colors.background,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    padding: 24,
    gap: 10,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 22,
  },
  message: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
});
