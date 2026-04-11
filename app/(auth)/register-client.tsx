import { useMemo, useState } from "react";
import {
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Screen from "../../src/components/Screen";
import PrimaryButton from "../../src/components/PrimaryButton";
import { sendOtp } from "../../src/services/auth";
import { COUNTRIES_LATAM, type CountryLatam } from "../../src/constants/countriesLatam";

export default function LoginClient() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);

  const defaultCountry = useMemo(
    () => COUNTRIES_LATAM.find((item) => item.code === "PE") ?? COUNTRIES_LATAM[0],
    [],
  );
  const [country, setCountry] = useState<CountryLatam>(defaultCountry);

  const handlePhoneChange = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");
    setPhone(onlyNumbers);
  };

  const handleSend = async () => {
    const localNumber = phone.trim().replace(/\D/g, "");
    if (!localNumber) {
      setError("Ingresa tu número de celular.");
      return;
    }

    const fullNumber = `${country.dialCode}${localNumber}`;

    try {
      setLoading(true);
      setError("");
      await sendOtp(fullNumber);
      router.push({
        pathname: "/(auth)/otp",
        params: {
          role: "client",
          phone: fullNumber,
          dialCode: country.dialCode,
          localPhone: localNumber,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo enviar el codigo.";
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

          <Text className="text-white text-3xl font-bold">Crear cuenta</Text>
          <Text className="text-white/70 text-lg mt-2 mb-6">
            Te enviaremos un codigo de verificacion para validar tu numero. {"\n"} {"\n"}
            Completa tu registro para crear tu cuenta.
          </Text>

          <Modal
            visible={countryOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setCountryOpen(false)}
          >
            <View className="flex-1 bg-black/60">
              <Pressable
                className="flex-1"
                onPress={() => setCountryOpen(false)}
              />
              <View className="bg-neutral-900 border border-white/10 rounded-t-2xl p-4 max-h-[70%]">
                <Text className="text-white text-lg font-bold mb-3">
                  Selecciona un pais
                </Text>
                <ScrollView>
                  {COUNTRIES_LATAM.map((item) => (
                    <Pressable
                      key={item.code}
                      onPress={() => {
                        setCountry(item);
                        setCountryOpen(false);
                      }}
                      className="flex-row items-center justify-between py-3 border-b border-white/10"
                    >
                      <Text className="text-white">{item.name}</Text>
                      <Text className="text-white/70">+{item.dialCode}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <View className="mt-1">
            <Text className="text-white text-base mb-2">Número de celular</Text>
            <View className="h-14 rounded-2xl border border-white/20 bg-white/5 px-3 flex-row items-center">
              <Pressable
                onPress={() => setCountryOpen(true)}
                className="h-full justify-center pr-3 mr-3 border-r border-white/20"
              >
                <Text className="text-white text-lg font-semibold">+{country.dialCode}</Text>
              </Pressable>
              <TextInput
                className="flex-1 text-white text-lg"
                placeholder="999 999 999"
                placeholderTextColor="rgba(255,255,255,0.45)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={handlePhoneChange}
                textContentType="telephoneNumber"
                maxLength={15}
              />
            </View>
          </View>

          {error ? (
            <Text className="text-red-400 text-sm mt-2">{error}</Text>
          ) : null}

          <View className="mt-6">
            <PrimaryButton
              title={loading ? "Enviando..." : "Enviar codigo"}
              onPress={handleSend}
              disabled={loading}
            />
          </View>

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
