import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Screen from "../../src/components/Screen";
import { Ionicons } from "@expo/vector-icons";

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  className?: string;
};

function ActionButton({ icon, label, onPress, className = "" }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`bg-red-600 rounded-2xl py-4 px-4 flex-row items-center ${className}`}
    >
      <View className="w-10 h-10 rounded-lg bg-red-800 items-center justify-center">
        <Ionicons name={icon} size={20} color="white" />
      </View>
      <Text className="text-white text-base font-semibold ml-3">{label}</Text>
    </Pressable>
  );
}

export default function CodeHelp() {
  return (
    <Screen>
      <Pressable
        onPress={() => router.back()}
        className="mt-6 mb-6 flex-row items-center"
      >
        <Ionicons name="arrow-back" size={20} color="white" />
        <Text className="text-white text-base ml-2">Volver</Text>
      </Pressable>

      <Text className="text-white text-3xl font-bold">
        ¿No recibiste el código?
      </Text>
      <Text className="text-white/70 text-lg mt-5 mb-8">
        Selecciona una opcion para ayudarte.
      </Text>

      <ActionButton
        icon="chatbubble-ellipses-outline"
        label="Reenviar OTP"
        onPress={() => router.back()}
      />
      <ActionButton
        icon="call-outline"
        label="Cambiar numero"
        onPress={() => router.replace("/(auth)/login-client")}
        className="mt-4"
      />
      <ActionButton
        icon="mail-outline"
        label="Contactar soporte"
        onPress={() => router.back()}
        className="mt-4"
      />

      <Pressable onPress={() => router.replace("/(auth)/choose-access")}
        className="mt-12">
        <Text className="text-white text-center text-lg">Volver al inicio</Text>
      </Pressable>
    </Screen>
  );
}
