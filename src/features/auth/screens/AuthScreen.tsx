import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import AppScreen from "../../../components/ui/AppScreen";
import GoogleButton from "../../../components/ui/GoogleButton";
import { useAuth } from "../../../context/AuthContext";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "../../../config";
import { loginWithEmail, loginWithGoogle, sendOtp } from "../../../services/auth";

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
  iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
});

type Mode = "login" | "register";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();
  const { setSession, logout } = useAuth();

  // Enruta por el modo activo del toggle (con fallback al rol legacy).
  function navigateByRole(role: string, activeMode?: string) {
    if (role === "ADMIN") {
      router.replace("/(public)/admin-only");
    } else if ((role === "ANFITRIONA" || role === "PROFESSIONAL") && activeMode !== "USER") {
      router.replace("/(professional)/dashboard");
    } else {
      router.replace("/(user)/home");
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedRegisterEmail = registerEmail.trim().toLowerCase();

  async function handleLogin() {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await loginWithEmail(email.trim(), password);
      if (response.user.role === "ADMIN") {
        await logout();
        navigateByRole(response.user.role);
        return;
      }
      await setSession(response.access_token, response.user);
      navigateByRole(response.user.role, response.user.activeMode);
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
      await sendOtp(normalizedRegisterEmail);
      router.push({
        pathname: "/(public)/verify-otp",
        params: { email: normalizedRegisterEmail },
      });
    } catch (error: any) {
      const message = error?.message ?? "Revisa el correo y vuelve a intentar.";
      setErrorMessage(message);
      Alert.alert("No se pudo continuar", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    try {
      setLoading(true);
      setErrorMessage(null);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      const response = await GoogleSignin.signIn();
      if (response.type === "cancelled") return;
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error("Google no devolvió id_token.");
      const result = await loginWithGoogle(idToken);
      if (result.user.role === "ADMIN") {
        await logout();
        navigateByRole(result.user.role);
        return;
      }
      await setSession(result.access_token, result.user);
      navigateByRole(result.user.role, result.user.activeMode);
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
        if (error.code === statusCodes.IN_PROGRESS) return;
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert("Error", "Google Play Services no disponible en este dispositivo.");
          return;
        }
      }
      const message = error?.message ?? "No se pudo iniciar sesión con Google.";
      setErrorMessage(message);
      Alert.alert("Google Login falló", message);
    } finally {
      setLoading(false);
    }
  }

  const loginDisabled = !email.trim() || !password || loading;
  const registerDisabled = !emailRegex.test(normalizedRegisterEmail) || loading;

  // Sora en todo este formulario (se migrará a global más adelante).
  const sora = {
    regular: { fontFamily: "Sora-Regular" },
    semibold: { fontFamily: "Sora-SemiBold" },
    bold: { fontFamily: "Sora-Bold" },
  } as const;

  const fieldLabel = "text-[#020617] text-[15px]";
  const textInput = "min-h-[52px] rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] px-[14px] text-[#020617] text-sm";
  const primaryBtn = "min-h-[54px] rounded-[18px] bg-[#5B9BD5] items-center justify-center";
  const primaryBtnText = "text-white text-[17px]";
  const divider = (
    <View className="flex-row items-center gap-2.5 -mt-0.5">
      <View className="flex-1 h-px bg-[#CBD5E1]" />
      <Text className="text-[#64748B] text-sm" style={sora.semibold}>o</Text>
      <View className="flex-1 h-px bg-[#CBD5E1]" />
    </View>
  );

  return (
    <AppScreen scroll contentPadding={0}>
      <View className="flex-1 justify-center bg-[#F7FAFC] px-4 pt-2 pb-[18px]">
        <View className="min-h-[620px] rounded-[20px] bg-white border border-[#CBD5E1] px-4 py-[18px] justify-between gap-3">
          <View className="flex-row items-center gap-4">
            <Image
              source={require("../../../../assets/logo.webp")}
              className="w-20 h-20 rounded-2xl"
              resizeMode="contain"
            />
            <View className="flex-1">
              <Text
                className="text-[#020617] text-2xl leading-[30px]"
                style={{ fontFamily: "Sora-Bold" }}
              >
                {mode === "login" ? "Bienvenido" : "Crear cuenta"}
              </Text>
              <Text className="text-[#475569] text-sm leading-[20px] mt-1" style={sora.regular}>
                {mode === "login" ? "Accede a tu cuenta segura" : "Regístrate para comenzar tu experiencia"}
              </Text>
            </View>
          </View>

          <View className="flex-row rounded-[17px] border border-[#CBD5E1] bg-[#F8FAFC] p-1 gap-1">
            <Pressable
              className={`flex-1 min-h-[42px] rounded-[13px] items-center justify-center ${mode === "login" ? "bg-white border border-[#CBD5E1]" : ""}`}
              onPress={() => setMode("login")}
            >
              <Text
                className={`text-sm ${mode === "login" ? "text-[#020617]" : "text-[#64748B]"}`}
                style={{ fontFamily: "Sora-SemiBold" }}
              >
                Iniciar sesión
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 min-h-[42px] rounded-[13px] items-center justify-center ${mode === "register" ? "bg-white border border-[#CBD5E1]" : ""}`}
              onPress={() => setMode("register")}
            >
              <Text
                className={`text-sm ${mode === "register" ? "text-[#020617]" : "text-[#64748B]"}`}
                style={{ fontFamily: "Sora-SemiBold" }}
              >
                Registrarse
              </Text>
            </Pressable>
          </View>

          {mode === "login" ? (
            <>
              <View className="gap-2">
                <Text className={fieldLabel} style={sora.semibold}>Correo electrónico</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ana@ejemplo.com"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className={textInput}
                  style={sora.regular}
                />
              </View>

              <View className="gap-2">
                <Text className={fieldLabel} style={sora.semibold}>Contraseña</Text>
                <View className="min-h-[52px] rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] px-[14px] flex-row items-center gap-2">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="********"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    className="flex-1 text-[#020617] text-sm py-0"
                    style={sora.regular}
                  />
                  <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={10}>
                    <Text className="text-[#5B9BD5] text-sm" style={sora.semibold}>{showPassword ? "Ocultar" : "Ver"}</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                className="items-center -mt-0.5"
                onPress={() => router.push("/(public)/forgot-password" as any)}
              >
                <Text className="text-[#5B9BD5] text-[15px]" style={sora.regular}>¿Olvidaste tu contraseña?</Text>
              </Pressable>

              <Pressable
                className={`${primaryBtn} ${loginDisabled ? "opacity-[0.65]" : ""}`}
                onPress={handleLogin}
                disabled={loginDisabled}
              >
                <Text className={primaryBtnText} style={sora.bold}>{loading ? "Ingresando..." : "Iniciar sesión"}</Text>
              </Pressable>

              {divider}
              {GOOGLE_WEB_CLIENT_ID ? (
                <GoogleButton loading={loading} onPress={handleGoogleAuth} />
              ) : null}
            </>
          ) : (
            <>
              <View className="gap-2">
                <Text className={fieldLabel} style={sora.semibold}>Correo electrónico</Text>
                <TextInput
                  value={registerEmail}
                  onChangeText={setRegisterEmail}
                  placeholder="ana@ejemplo.com"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className={textInput}
                  style={sora.regular}
                />
              </View>

              <Pressable
                className={`${primaryBtn} ${registerDisabled ? "opacity-[0.65]" : ""}`}
                onPress={handleRegister}
                disabled={registerDisabled}
              >
                <Text className={primaryBtnText} style={sora.bold}>{loading ? "Enviando..." : "Continuar"}</Text>
              </Pressable>

              {divider}
              {GOOGLE_WEB_CLIENT_ID ? (
                <GoogleButton loading={loading} onPress={handleGoogleAuth} />
              ) : null}

              <Pressable
                className="flex-row items-center gap-3 min-h-[58px] rounded-2xl border-[1.5px] border-[#5B9BD5] bg-[#EAF2FB] px-4 mt-1 active:opacity-80"
                onPress={() => router.push("/(public)/professional-register" as any)}
              >
                <View className="w-10 h-10 rounded-full bg-[#5B9BD5] items-center justify-center">
                  <Ionicons name="briefcase" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#1E3A5F] text-[15px]" style={sora.bold}>¿Eres profesional?</Text>
                  <Text className="text-[#5B9BD5] text-xs" style={sora.semibold}>Regístrate y ofrece tus sesiones</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color="#5B9BD5" />
              </Pressable>
            </>
          )}

          {errorMessage ? <Text className="text-[#DC2626] text-xs text-center" style={sora.regular}>{errorMessage}</Text> : null}
        </View>
      </View>
    </AppScreen>
  );
}
