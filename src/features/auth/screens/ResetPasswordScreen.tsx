import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppScreen from "../../../components/ui/AppScreen";
import { resetPassword } from "../../../services/auth";
import { appTheme } from "../../../theme/appTheme";

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const initialEmail = Array.isArray(params.email) ? params.email[0] : params.email ?? "";

  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const normalizedCode = useMemo(() => code.trim(), [code]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(public)/forgot-password");
  }

  async function handleReset() {
    if (newPassword !== confirmPassword) {
      Alert.alert("Validacion", "Las contrasenas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      const response = await resetPassword(normalizedEmail, normalizedCode, newPassword);
      Alert.alert("Contrasena actualizada", response.message, [
        {
          text: "Ir a login",
          onPress: () => router.replace("/(public)/auth"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("No se pudo restablecer", error?.message ?? "Revisa el codigo e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  const disableSubmit =
    loading ||
    !isValidEmail(normalizedEmail) ||
    !/^\d{6}$/.test(normalizedCode) ||
    newPassword.length < 6 ||
    confirmPassword.length < 6 ||
    newPassword !== confirmPassword;

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>

        <Text style={styles.title}>Restablecer contrasena</Text>
        <Text style={styles.subtitle}>
          Ingresa el correo, codigo de 6 digitos y tu nueva contrasena.
        </Text>

        <AppInput
          label="Correo electronico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="ana@ejemplo.com"
        />

        <AppInput
          label="Codigo"
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          placeholder="123456"
        />

        <AppInput
          label="Nueva contrasena"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          showPasswordToggle
          placeholder="Minimo 6 caracteres"
        />

        <AppInput
          label="Confirmar nueva contrasena"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          showPasswordToggle
          placeholder="Repite la contrasena"
        />

        <AppButton
          title="Cambiar contrasena"
          onPress={handleReset}
          loading={loading}
          disabled={disableSubmit}
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
