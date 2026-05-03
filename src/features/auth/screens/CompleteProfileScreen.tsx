import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { completeRegistration } from "../../../services/auth";
import { appTheme } from "../../../theme/appTheme";

export default function CompleteProfileScreen() {
  const params = useLocalSearchParams<{
    tempToken?: string | string[];
    phone?: string | string[];
    phoneDialCode?: string | string[];
    phoneNationalNumber?: string | string[];
    phoneCountryIso?: string | string[];
    phoneCountryName?: string | string[];
  }>();
  const tempToken = Array.isArray(params.tempToken) ? params.tempToken[0] : params.tempToken ?? "";
  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone ?? "";
  const phoneDialCode = Array.isArray(params.phoneDialCode) ? params.phoneDialCode[0] : params.phoneDialCode ?? "";
  const phoneNationalNumber = Array.isArray(params.phoneNationalNumber)
    ? params.phoneNationalNumber[0]
    : params.phoneNationalNumber ?? "";
  const phoneCountryIso = Array.isArray(params.phoneCountryIso) ? params.phoneCountryIso[0] : params.phoneCountryIso ?? "";
  const phoneCountryName = Array.isArray(params.phoneCountryName)
    ? params.phoneCountryName[0]
    : params.phoneCountryName ?? "";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const router = useRouter();

  const isFormInvalid =
    !firstName.trim() ||
    !lastName.trim() ||
    !email.trim() ||
    !password ||
    !confirmPassword ||
    password !== confirmPassword ||
    !acceptedTerms;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (phone) {
      router.replace({
        pathname: "/(public)/verify-otp",
        params: { phone, phoneDialCode, phoneNationalNumber, phoneCountryIso, phoneCountryName },
      });
      return;
    }

    router.replace("/(public)/auth");
  }

  async function handleSubmit() {
    if (!tempToken) {
      Alert.alert("Token invalido", "Vuelve a iniciar el registro.");
      return;
    }

    try {
      setLoading(true);
      const response = await completeRegistration({
        tempToken,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      await setSession(response.access_token, response.user);
      router.replace("/(user)/home");
    } catch (error: any) {
      Alert.alert("No se pudo completar", error?.message ?? "Revisa los datos e intenta nuevamente.");
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

        <Text style={styles.title}>Completa tu perfil</Text>
        <Text style={styles.subtitle}>Configura tu cuenta para empezar a usar la plataforma.</Text>

        <AppInput label="Nombre" value={firstName} onChangeText={setFirstName} />
        <AppInput label="Apellido" value={lastName} onChangeText={setLastName} />
        <AppInput label="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <AppInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
        <AppInput label="Confirmar contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        <Pressable style={styles.termsRow} onPress={() => setAcceptedTerms((prev) => !prev)}>
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]} />
          <Text style={styles.termsText}>
            Acepto los{" "}
            <Text style={styles.termsLink} onPress={() => router.push("/terms" as any)}>
              Términos y Condiciones
            </Text>
            .
          </Text>
        </Pressable>

        <AppButton title="Crear cuenta" onPress={handleSubmit} loading={loading} disabled={isFormInvalid} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
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
    marginBottom: 6,
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    marginTop: 1,
    backgroundColor: "#FFFFFF",
  },

  checkboxActive: {
    borderColor: appTheme.colors.primary,
    backgroundColor: appTheme.colors.primary,
  },

  termsText: {
    flex: 1,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },

  termsLink: {
    color: appTheme.colors.primary,
    fontWeight: "700",
  },
});
