import { useState } from "react";
import {
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Screen from "../../src/components/Screen";
import TextField from "../../src/components/TextField";
import PrimaryButton from "../../src/components/PrimaryButton";
import { resetPassword } from "../../src/services/auth";

export default function ResetPassword() {
  const { email, role } = useLocalSearchParams<{ email: string; role?: string }>();
  const roleValue = Array.isArray(role) ? role[0] : role || "client";
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmedCode = code.trim();
    const trimmedPassword = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedCode || !trimmedPassword || !trimmedConfirm) {
      setError("Completa todos los campos.");
      return;
    }

    if (trimmedCode.length !== 6 || !/^\d+$/.test(trimmedCode)) {
      setError("El código debe ser de 6 dígitos.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await resetPassword(email ?? "", trimmedCode, trimmedPassword);
      const loginRoute = roleValue === "anfitriona" ? "/(auth)/login-hostess" : "/(auth)/login-client";
      router.replace(loginRoute);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo restablecer la contraseña.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow"
        >
          <Pressable
            onPress={() => router.back()}
            className="mt-6 mb-6 flex-row items-center"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text className="text-white text-base ml-2">Volver</Text>
          </Pressable>

          <Text className="text-white text-3xl font-bold">Nueva contraseña</Text>
          <Text className="text-white/70 text-lg mt-2 mb-6">
            Ingresa el código que enviamos a{" "}
            <Text className="text-white font-semibold">{email}</Text> y elige una
            nueva contraseña.
          </Text>

          <TextField
            label="Código de verificación"
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
          />

          <TextField
            label="Nueva contraseña"
            placeholder="********"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            textContentType="newPassword"
          />

          <TextField
            label="Confirmar contraseña"
            placeholder="********"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
          />

          {error ? (
            <Text className="text-red-400 text-sm mt-2">{error}</Text>
          ) : null}

          <PrimaryButton
            title={loading ? "Guardando..." : "Restablecer contraseña"}
            onPress={handleSubmit}
            disabled={loading}
            className="mt-4"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
