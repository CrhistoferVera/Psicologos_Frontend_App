import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { verifyOtp } from "../../../services/auth";
import { appTheme } from "../../../theme/appTheme";

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = params.phone ?? "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setSession } = useAuth();

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
        <Text style={styles.title}>Verifica tu código</Text>
        <Text style={styles.subtitle}>Ingresá el código OTP enviado al número {phone}.</Text>

        <AppInput
          label="Código OTP"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          placeholder="123456"
        />

        <AppButton title="Verificar" onPress={handleVerify} loading={loading} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
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

