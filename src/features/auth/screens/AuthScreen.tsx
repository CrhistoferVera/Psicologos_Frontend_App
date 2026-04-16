import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
  const [showPassword, setShowPassword] = useState(false);
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
      Alert.alert("No se pudo iniciar sesión", message);
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
      const message = error?.message ?? "Revisa el número y vuelve a intentar.";
      setErrorMessage(message);
      Alert.alert("No se pudo continuar", message);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    Alert.alert("Próximamente", "Inicio con Google se habilitará en la siguiente iteración.");
  }

  const loginDisabled = !email.trim() || !password || loading;
  const registerDisabled = phone.trim().length < 8 || loading;

  return (
    <AppScreen scroll contentPadding={0}>
      <View style={styles.page}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={21} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>{mode === "login" ? "Bienvenido de vuelta" : "Crear cuenta"}</Text>
          <Text style={styles.subtitle}>
            {mode === "login" ? "Accede a tu cuenta segura" : "Regístrate para comenzar tu experiencia"}
          </Text>

          <View style={styles.segmentedWrap}>
            <Pressable
              style={[styles.segmentBtn, mode === "login" && styles.segmentBtnActive]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.segmentText, mode === "login" && styles.segmentTextActive]}>Iniciar sesión</Text>
            </Pressable>

            <Pressable
              style={[styles.segmentBtn, mode === "register" && styles.segmentBtnActive]}
              onPress={() => setMode("register")}
            >
              <Text style={[styles.segmentText, mode === "register" && styles.segmentTextActive]}>Registrarse</Text>
            </Pressable>
          </View>

          {mode === "login" ? (
            <>
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ana@ejemplo.com"
                  placeholderTextColor="#7287A2"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#7287A2"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={styles.passwordInput}
                  />
                  <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={10}>
                    <Text style={styles.passwordToggle}>{showPassword ? "Ocultar" : "Ver"}</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable style={styles.forgotWrap} onPress={() => router.push("/(auth)/forgot-password" as any)}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </Pressable>

              <Pressable
                style={[styles.primaryBtn, loginDisabled && styles.primaryBtnDisabled]}
                onPress={handleLogin}
                disabled={loginDisabled}
              >
                <Text style={styles.primaryBtnText}>{loading ? "Ingresando..." : "Iniciar sesión"}</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable style={styles.googleBtn} onPress={handleGoogle}>
                <View style={styles.googleDot} />
                <Text style={styles.googleText}>Continuar con Google</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Número de teléfono</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+59170000000"
                  placeholderTextColor="#7287A2"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>

              <Text style={styles.registerHelp}>Te enviaremos un código OTP para validar tu cuenta.</Text>

              <Pressable
                style={[styles.primaryBtn, registerDisabled && styles.primaryBtnDisabled]}
                onPress={handleRegister}
                disabled={registerDisabled}
              >
                <Text style={styles.primaryBtnText}>{loading ? "Enviando..." : "Continuar"}</Text>
              </Pressable>
            </>
          )}

          <Pressable style={styles.professionalCta} onPress={() => router.push("/(public)/professional-register" as any)}>
            <Text style={styles.professionalText}>Soy professional · Crear cuenta profesional</Text>
          </Pressable>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
  },
  card: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5ECF4",
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6F8FC8",
  },
  title: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 24,
    lineHeight: 31,
  },
  subtitle: {
    color: "#6C819C",
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    lineHeight: 22,
  },
  segmentedWrap: {
    flexDirection: "row",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D4DFEB",
    backgroundColor: "#F2F6FB",
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4ECF5",
  },
  segmentText: {
    color: "#6A7E97",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#172B46",
    fontWeight: "700",
  },
  fieldWrap: {
    gap: 8,
  },
  label: {
    color: "#253A56",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.primary,
    backgroundColor: "#F6FAFF",
    paddingHorizontal: 14,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  passwordWrap: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D4DFEB",
    backgroundColor: "#F4F7FB",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  passwordInput: {
    flex: 1,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    paddingVertical: 0,
  },
  passwordToggle: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  forgotWrap: {
    alignItems: "center",
    marginTop: -2,
  },
  forgotText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "500",
  },
  primaryBtn: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#DEE6F1",
  },
  dividerText: {
    color: "#9BAABC",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  googleBtn: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D5E0EC",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  googleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#5B9BD5",
  },
  googleText: {
    color: "#2B405B",
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    fontWeight: "600",
  },
  registerHelp: {
    color: "#6B809C",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  professionalCta: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE3D7",
    backgroundColor: "#F4FAF6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    paddingHorizontal: 10,
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
    textAlign: "center",
  },
});
