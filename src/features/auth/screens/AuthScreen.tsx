import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { loginWithEmail, sendOtp } from "../../../services/auth";
import { appTheme } from "../../../theme/appTheme";

type Mode = "login" | "register";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { setSession } = useAuth();

  async function handleLogin() {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await loginWithEmail(email.trim(), password);
      await setSession(response.access_token, response.user);

      if (response.user.role === "ADMIN") {
        router.replace("/admin");
      } else if (response.user.role === "ANFITRIONA" || response.user.role === "PROFESSIONAL") {
        router.replace("/(professional)/dashboard");
      } else {
        router.replace("/(user)/home");
      }
    } catch (error: any) {
      const message = error?.message ?? "Intenta nuevamente.";
      setErrorMessage(message);
      Alert.alert("No se pudo iniciar sesion", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    try {
      setLoading(true);
      setErrorMessage(null);
      const normalized = phone.trim();
      await sendOtp(normalized);
      router.push({ pathname: "/(public)/verify-otp", params: { phone: normalized } });
    } catch (error: any) {
      const message = error?.message ?? "Revisa el numero y vuelve a intentar.";
      setErrorMessage(message);
      Alert.alert("No se pudo continuar", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.kicker}>Bienvenido</Text>
        <Text style={styles.title}>Tu espacio de apoyo profesional</Text>
        <Text style={styles.subtitle}>Accede a psicologos y profesionales con un flujo claro y seguro.</Text>

        <View style={styles.tabs}>
          <AppButton
            title="Iniciar sesion"
            variant={mode === "login" ? "primary" : "secondary"}
            onPress={() => setMode("login")}
            style={styles.tabButton}
          />
          <AppButton
            title="Registrarme"
            variant={mode === "register" ? "primary" : "secondary"}
            onPress={() => setMode("register")}
            style={styles.tabButton}
          />
        </View>

        {mode === "login" ? (
          <View style={styles.form}>
            <AppInput label="Correo electronico" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <AppInput label="Contrasena" value={password} onChangeText={setPassword} secureTextEntry />
            <AppButton title="Entrar" onPress={handleLogin} loading={loading} disabled={!email.trim() || !password} />
          </View>
        ) : (
          <View style={styles.form}>
            <AppInput
              label="Numero de telefono (incluye codigo pais)"
              value={phone}
              onChangeText={setPhone}
              placeholder="+59170000000"
              keyboardType="phone-pad"
            />
            <Text style={styles.help}>Te enviaremos un codigo OTP para validar tu cuenta y completar tu registro.</Text>
            <AppButton
              title="Recibir codigo"
              onPress={handleRegister}
              loading={loading}
              disabled={phone.trim().length < 8}
            />
          </View>
        )}

        <Pressable style={styles.professionalCta} onPress={() => router.push("/(public)/professional-register" as any)}>
          <Text style={styles.professionalText}>Soy profesional · Crear cuenta profesional</Text>
        </Pressable>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  kicker: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  tabs: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  tabButton: {
    flex: 1,
  },
  form: {
    gap: 14,
    marginTop: 10,
  },
  help: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  professionalCta: {
    borderWidth: 1,
    borderColor: appTheme.colors.success,
    borderRadius: appTheme.radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F1F8F4",
  },
  professionalText: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "700",
  },
  errorText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
});
