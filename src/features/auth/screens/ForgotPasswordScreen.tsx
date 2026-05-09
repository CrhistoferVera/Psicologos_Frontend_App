import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppScreen from "../../../components/ui/AppScreen";
import { requestPasswordReset } from "../../../services/auth";
import { appTheme } from "../../../theme/appTheme";

const GENERIC_SUCCESS_MESSAGE =
  "Si el correo esta registrado, recibiras un codigo de recuperacion.";

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(public)/auth");
  }

  async function handleSendCode() {
    try {
      setLoading(true);
      await requestPasswordReset(normalizedEmail);
      Alert.alert("Codigo enviado", GENERIC_SUCCESS_MESSAGE, [
        {
          text: "Continuar",
          onPress: () =>
            router.push({
              pathname: "/(public)/reset-password",
              params: { email: normalizedEmail },
            }),
        },
      ]);
    } catch (error: any) {
      Alert.alert("No se pudo enviar", error?.message ?? "Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>

        <Text style={styles.title}>Olvide mi contrasena</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo para enviarte un codigo de recuperacion que expira en 15 minutos.
        </Text>

        <AppInput
          label="Correo electronico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="ana@ejemplo.com"
        />

        <AppButton
          title="Enviar codigo"
          onPress={handleSendCode}
          loading={loading}
          disabled={!isValidEmail(normalizedEmail) || loading}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },

  backBtn: {
    alignSelf: "flex-start",
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  backBtnText: {
    color: appTheme.colors.text,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },

  title: {
    color: appTheme.colors.text,
    fontSize: 26,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },

  subtitle: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: appTheme.fonts.body,
  },
});
