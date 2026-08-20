import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";

export default function SettingsHeader({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        className="w-8 h-8 rounded-full items-center justify-center border border-[#CBD5E1] bg-white active:bg-[#F1F5F9]"
        accessibilityRole="button"
        hitSlop={6}
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
      </Pressable>
      <Text className="text-[#020617] font-heading text-2xl font-bold">Configuración</Text>
    </View>
  );
}
