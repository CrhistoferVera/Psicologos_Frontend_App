import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppScreen from "../../../components/ui/AppScreen";
import CountrySelect from "../../../components/ui/CountrySelect";
import { COUNTRIES_LATAM, CountryLatam } from "../../../constants/countriesLatam";
import { useAuth } from "../../../context/AuthContext";
import { completeRegistration } from "../../../services/auth";
import { appTheme } from "../../../theme/appTheme";

const DEFAULT_COUNTRY = COUNTRIES_LATAM.find((item) => item.code === "BO") ?? COUNTRIES_LATAM[0];

export default function CompleteProfileScreen() {
  const params = useLocalSearchParams<{
    tempToken?: string | string[];
    email?: string | string[];
  }>();
  const tempToken = Array.isArray(params.tempToken) ? params.tempToken[0] : params.tempToken ?? "";
  const email = Array.isArray(params.email) ? params.email[0] : params.email ?? "";
  const [country, setCountry] = useState<CountryLatam>(DEFAULT_COUNTRY);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const router = useRouter();

  const missingReason = (() => {
    if (!firstName.trim() || !lastName.trim() || !password || !confirmPassword) {
      return "Completa todos los campos para continuar.";
    }
    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    if (password !== confirmPassword) {
      return "Las contraseñas no coinciden.";
    }
    if (!acceptedTerms) {
      return "Marca la casilla para aceptar los Términos y Condiciones.";
    }
    return null;
  })();

  const isFormInvalid = missingReason !== null;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (email) {
      router.replace({
        pathname: "/(public)/verify-otp",
        params: { email },
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
        country: country.code,
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

        {email ? <Text style={styles.verifiedEmail}>Correo verificado: {email}</Text> : null}
        <CountrySelect label="País" value={country} onChange={setCountry} />
        <AppInput label="Nombre" value={firstName} onChangeText={setFirstName} />
        <AppInput label="Apellido" value={lastName} onChangeText={setLastName} />
        <AppInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
        <AppInput label="Confirmar contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        <Pressable
          style={styles.termsRow}
          hitSlop={8}
          onPress={() => setAcceptedTerms((prev) => !prev)}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
            {acceptedTerms ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
          </View>
          <Text style={styles.termsText}>
            Acepto los{" "}
            <Text style={styles.termsLink} onPress={() => router.push("/terms" as any)}>
              Términos y Condiciones
            </Text>
            .
          </Text>
        </Pressable>

        <AppButton title="Crear cuenta" onPress={handleSubmit} loading={loading} disabled={isFormInvalid} />

        {missingReason ? <Text style={styles.missingReason}>{missingReason}</Text> : null}
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

  verifiedEmail: {
    color: appTheme.colors.success,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
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
    alignItems: "center",
    justifyContent: "center",
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

  missingReason: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 2,
  },
});
