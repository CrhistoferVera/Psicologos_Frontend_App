import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export default function MenuRow({ icon, iconColor, iconBg, title, subtitle, onPress }: Props) {
  return (
    <Pressable
      className="flex-row items-center gap-2.5 border border-[#CBD5E1] rounded-[14px] px-3 py-[11px] bg-white active:bg-[#F1F5F9] active:border-[#94A3B8]"
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
    >
      <View
        className="w-[34px] h-[34px] rounded-[17px] items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>

      <View className="flex-1">
        <Text className="text-[#020617] font-body text-[15px] font-bold">{title}</Text>
        <Text className="text-[#475569] font-body text-[13px] mt-0.5">{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#64748B" />
    </Pressable>
  );
}
