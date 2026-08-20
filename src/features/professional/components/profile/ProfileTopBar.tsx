import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { appTheme } from "../../../../theme/appTheme";

type Props = {
  onBack: () => void;
  onPublicView: () => void;
};

export default function ProfileTopBar({ onBack, onPublicView }: Props) {
  return (
    <View className="flex-row items-center justify-between px-3.5 pb-2 border-b border-[#DEE6F1]">
      <Pressable
        className="w-[30px] h-[30px] rounded-full items-center justify-center active:bg-[#EDF2F8]"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
      </Pressable>

      <Text className="flex-1 ml-1.5 text-[#172B46] font-heading text-[33px] font-bold">Mi perfil</Text>

      <Pressable
        className="flex-row items-center gap-1 rounded-full px-2.5 py-1.5 active:bg-[#EAF2FB]"
        accessibilityRole="button"
        hitSlop={6}
        onPress={onPublicView}
      >
        <Ionicons name="eye-outline" size={15} color={appTheme.colors.primary} />
        <Text className="text-[#5B9BD5] font-body text-[13px] font-semibold">Vista pública</Text>
      </Pressable>
    </View>
  );
}
