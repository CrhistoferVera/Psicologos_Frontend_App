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
import { forgotPassword } from "../../src/services/auth";

export default function ForgotPassword() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const roleValue = Array.isArray(role) ? role[0] : role || "client";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Ingresa tu correo.");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!isEmail) {
      setError("Ingresa un correo válido.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await forgotPassword(trimmedEmail);
      router.push({
        pathname: "/(auth)/reset-password",
        params: { email: trimmedEmail, role: roleValue },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo procesar la solicitud.";
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

          <Text className="text-white text-3xl font-bold">
            ¿Olvidaste tu contraseña?
          </Text>
          <Text className="text-white/70 text-lg mt-2 mb-6">
            Ingresa tu correo y te enviaremos un código para recuperar tu cuenta.
          </Text>

          <TextField
            label="Email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          {error ? (
            <Text className="text-red-400 text-sm mt-2">{error}</Text>
          ) : null}

          <PrimaryButton
            title={loading ? "Enviando..." : "Enviar código"}
            onPress={handleSubmit}
            disabled={loading}
            className="mt-4"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
