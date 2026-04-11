import { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Screen from "../../src/components/Screen";
import PrimaryButton from "../../src/components/PrimaryButton";
import { sendOtp, verifyOtp } from "../../src/services/auth";
import { apiSendOtp, apiVerifyOtp } from "../../src/api/registerAnfitriona";
import { useAuth } from "../../src/context/AuthContext";
import { removeTempToken, setTempToken } from "../../src/storage/authStorage";

export default function Otp() {
  const { role, phone, dialCode, localPhone } = useLocalSearchParams<{
    role?: string;
    phone?: string;
    dialCode?: string;
    localPhone?: string;
  }>();
  const roleValue = Array.isArray(role) ? role[0] : role || "client";
  const phoneValue = Array.isArray(phone) ? phone[0] : phone || "999999999";
  const dialValue = Array.isArray(dialCode) ? dialCode[0] : dialCode || "";
  const localValue = Array.isArray(localPhone) ? localPhone[0] : localPhone || "";
  const hasLocal = Boolean(localValue) && Boolean(dialValue);
  const displayPhone = hasLocal ? `+${dialValue} ${localValue}` : `+${phoneValue}`;

  const { setSession } = useAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput | null>(null);

  const digits = useMemo(() => {
    const padded = (code + "      ").slice(0, 6);
    return padded.split("");
  }, [code]);

  const handleChange = (text: string) => {
    const onlyNumbers = text.replace(/\D/g, "").slice(0, 6);
    setCode(onlyNumbers);
  };

  const handleVerify = async () => {
    if (roleValue === "hostess") {
      router.replace("/(anfitriona)");
      return;
    }

    if (code.length < 6) {
      setError("Ingresa el c\u00f3digo completo.");
      return;
    }

    if (roleValue === "anfitriona") {
      try {
        setLoading(true);
        setError("");
        const result = await apiVerifyOtp({ phoneNumber: phoneValue, code });
        if (!result.needsProfile) {
          setError("Este número ya tiene una cuenta registrada.");
          return;
        }
        await setTempToken(result.tempToken);
        router.replace("/(auth)/profile-anfitriona");
      } catch (err: any) {
        setError(typeof err === "string" ? err : "No se pudo verificar el código.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await verifyOtp(phoneValue, code);
      if ("access_token" in result) {
        await setSession(result.access_token, result.user);
        await removeTempToken();
        router.replace("/(cliente)");
        return;
      }

      await setTempToken(result.tempToken);
      router.replace({
        pathname: "/(auth)/profile",
        params: { phone: phoneValue },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo verificar el c\u00f3digo.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (roleValue === "anfitriona") {
      try {
        setResending(true);
        await apiSendOtp({ phoneNumber: phoneValue });
        Alert.alert("Reenviar", "Código reenviado");
      } catch (err: any) {
        setError(typeof err === "string" ? err : "No se pudo reenviar el código.");
      } finally {
        setResending(false);
      }
      return;
    }

    if (roleValue !== "client") {
      Alert.alert("Reenviar", "Codigo reenviado");
      return;
    }

    try {
      setResending(true);
      await sendOtp(phoneValue);
      Alert.alert("Reenviar", "Codigo reenviado");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo reenviar el c\u00f3digo.";
      setError(message);
    } finally {
      setResending(false);
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

          <Text className="text-white text-3xl font-bold">Codigo OTP</Text>
          <Text className="text-white/70 text-lg mt-8 mb-10">
            Enviado al {displayPhone}
          </Text>

          <Pressable
            onPress={() => inputRef.current?.focus()}
            className="flex-row justify-between"
          >
            {digits.map((digit, index) => (
              <View
                key={`digit-${index}`}
                className={`w-12 h-12 rounded-xl border border-neutral-700 items-center justify-center ${
                  digit.trim() ? "border-white" : ""
                }`}
              >
                <Text className="text-white text-xl">{digit.trim()}</Text>
              </View>
            ))}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={6}
            className="absolute opacity-0"
          />

          {error ? (
            <Text className="text-red-400 text-sm mt-4 text-center">{error}</Text>
          ) : null}

          <PrimaryButton
            title={loading ? "Verificando..." : "Verificar"}
            onPress={handleVerify}
            disabled={loading}
            className="mt-8"
          />

          <Pressable onPress={handleResend} className="mt-4">
            <Text className="text-white/60 text-center underline">
              {resending ? "Reenviando..." : "Reenviar codigo"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/code-help")}
            className="mt-6"
          >
            <Text className="text-white/60 text-center underline">
              Problemas con el codigo
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
