import { Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Screen from "../../src/components/Screen";
import PrimaryButton from "../../src/components/PrimaryButton";

export default function ClientAccess() {
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

          <Text className="text-white text-3xl font-bold">Acceso cliente</Text>
          <Text className="text-white/70 text-lg mt-2 mb-8">
            Elige como quieres ingresar.
          </Text>

          <PrimaryButton
            title="Ya tengo cuenta"
            onPress={() => router.push("/(auth)/login-client")}
          />

          <PrimaryButton
            title="Soy nuevo"
            onPress={() => router.push("/(auth)/register-client")}
            className="mt-4"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
