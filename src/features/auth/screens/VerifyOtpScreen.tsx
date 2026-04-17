import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { verifyOtp } from "../../../services/auth";
import { appTheme } from "../../../theme/appTheme";

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{ phone?: string | string[] }>();
  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone ?? "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setSession } = useAuth();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(public)/auth");
  }

  async function handleVerify() {
    try {
      setLoading(true);
      const response = await verifyOtp(phone, code.trim());
      if ("access_token" in response) {
        await setSession(response.access_token, response.user);
        router.replace("/(user)/home");
        return;
      }

      router.replace({
        pathname: "/(public)/complete-profile",
        params: {
          tempToken: response.tempToken,
          phone,
        },
      });
    } catch (error: any) {
      Alert.alert("Código inválido", error?.message ?? "No se pudo verificar el código.");
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

        <Text style={styles.title}>Verifica tu código</Text>
        <Text style={styles.subtitle}>Ingresa el código OTP enviado al número {phone}.</Text>

        <AppInput
          label="Código OTP"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          placeholder="123456"
        />

        <AppButton
          title="Verificar"
          onPress={handleVerify}
          loading={loading}
          disabled={!phone || code.trim().length < 4}
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
    minHeight: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
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
    color: appTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: appTheme.fonts.body,
  },
});
