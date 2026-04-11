import { useEffect, useState } from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import TextField from "../../src/components/TextField";
import PrimaryButton from "../../src/components/PrimaryButton";
import { completeRegistration } from "../../src/services/auth";
import { useAuth } from "../../src/context/AuthContext";
import { getTempToken, removeTempToken } from "../../src/storage/authStorage";

export default function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [checkingToken, setCheckingToken] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setSession } = useAuth();

  useEffect(() => {
    const loadToken = async () => {
      const token = await getTempToken();
      setTempToken(token);
      setCheckingToken(false);
    };
    void loadToken();
  }, []);

  const handleContinue = async () => {
    if (!tempToken) {
      setError("No se encontr\u00f3 el token temporal.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Ingresa tu nombre.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Ingresa tu correo electronico.");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!isEmail) {
      setError("Ingresa un correo válido.");
      return;
    }

    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const [firstName, ...rest] = trimmedName.split(/\s+/);
    const lastName = rest.join(" ");

    try {
      setLoading(true);
      setError("");
      const response = await completeRegistration({
        tempToken,
        firstName,
        lastName,
        email: trimmedEmail,
        password,
        confirmPassword: confirm,
      });
      await setSession(response.access_token, response.user);
      await removeTempToken();
      router.replace("/(cliente)");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo completar el registro.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!checkingToken && !tempToken) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", paddingHorizontal: 24, paddingTop: 40 }}>
        <Text className="text-white text-2xl font-semibold mt-8">
          Token temporal no encontrado
        </Text>
        <Text className="text-white/70 text-base mt-4">
          Vuelve a iniciar sesion para solicitar un nuevo codigo.
        </Text>
        <PrimaryButton
          title="Volver a login"
          onPress={() => router.replace("/(auth)/client-access")}
          className="mt-6"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 40 }}
      >
        <Text className="text-white text-3xl font-semibold mt-8">Tu perfil</Text>
        <Text className="text-white/70 text-lg mt-5 mb-6">
          Completa tu informacion para continuar.
        </Text>

        <TextField
          label="Nombre"
          placeholder="Tu nombre"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          textContentType="name"
        />

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

        <TextField
          label="Confirmar contraseña"
          placeholder="********"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          textContentType="password"
        />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
          <Pressable onPress={() => setAccepted((prev) => !prev)} style={{ marginTop: 3, marginRight: 12 }}>
            <View
              style={{
                width: 20, height: 20, borderRadius: 4,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: accepted ? 'white' : 'transparent',
              }}
            >
              {accepted && <View style={{ width: 12, height: 12, backgroundColor: 'black', borderRadius: 2 }} />}
            </View>
          </Pressable>
          <Pressable onPress={() => setAccepted((prev) => !prev)} style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }}>
              He leido y acepto los{' '}
              <Text
                style={{ color: '#f87171', textDecorationLine: 'underline' }}
                onPress={() => router.push('/(cliente)/terminos')}
              >
                Términos y Condiciones
              </Text>
              {' '}de uso.
            </Text>
          </Pressable>
        </View>

        {error ? (
          <Text className="text-red-400 text-sm mt-2">{error}</Text>
        ) : null}

        <PrimaryButton
          title={loading ? "Guardando..." : "Continuar"}
          onPress={handleContinue}
          disabled={!accepted || loading}
          className="mt-6"
        />

        <Pressable
          onPress={() => router.replace("/(auth)/client-access")}
          className="mt-4 mb-8"
        >
          <Text className="text-white/60 text-center underline">
            Volver al login
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
