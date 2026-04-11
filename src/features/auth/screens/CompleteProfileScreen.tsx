import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { completeRegistration } from "../../../services/auth";
import { appTheme } from "../../../theme/appTheme";

export default function CompleteProfileScreen() {
  const params = useLocalSearchParams<{ tempToken?: string; phone?: string }>();
  const tempToken = params.tempToken ?? "";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const router = useRouter();

  async function handleSubmit() {
    if (!tempToken) {
      Alert.alert("Token inválido", "Vuelve a iniciar el registro.");
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
        <Text style={styles.title}>Completa tu perfil</Text>
        <Text style={styles.subtitle}>Configura tu cuenta para empezar a usar la plataforma.</Text>
        <AppInput label="Nombre" value={firstName} onChangeText={setFirstName} />
        <AppInput label="Apellido" value={lastName} onChangeText={setLastName} />
        <AppInput label="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <AppInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
        <AppInput
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <AppButton title="Crear cuenta" onPress={handleSubmit} loading={loading} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
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
    marginBottom: 6,
  },
});

