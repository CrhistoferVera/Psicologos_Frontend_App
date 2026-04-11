import { useState } from "react";
import {
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Screen from "../../src/components/Screen";
import TextField from "../../src/components/TextField";
import PrimaryButton from "../../src/components/PrimaryButton";
import { loginWithEmail } from "../../src/services/auth";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginClientEmail() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setSession } = useAuth();

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Ingresa tu correo y contraseña.");
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
      const response = await loginWithEmail(trimmedEmail, trimmedPassword);

      if (response.user.role !== "USER") {
        setError("Acceso solo para clientes.");
        return;
      }

      await setSession(response.access_token, response.user);
      router.replace("/(cliente)");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar sesión.";
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

          <Text className="text-white text-3xl font-bold">Iniciar sesión</Text>
          <Text className="text-white/70 text-lg mt-2 mb-6">
            Accede con tu correo y contraseña.
          </Text>

          <TextField
            label="Email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <TextField
            label="Contraseña"
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />

          {error ? (
            <Text className="text-red-400 text-sm mt-2">{error}</Text>
          ) : null}

          <PrimaryButton
            title={loading ? "Ingresando..." : "Iniciar sesión"}
            onPress={handleLogin}
            disabled={loading}
            className="mt-4"
          />

          <Pressable
            onPress={() => router.push("/(auth)/forgot-password")}
            className="mt-4"
          >
            <Text className="text-white/60 text-center underline">
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(auth)/register-client")}
            className="mt-4"
          >
            <Text className="text-white/60 text-center underline">
              Soy nuevo, crear cuenta
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
