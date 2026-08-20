import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

type Props = {
  avatarUrl: string | null;
  displayName: string;
  roleSubtitle: string;
  isVerified?: boolean;
  onPickAvatar: () => void;
};

export default function IdentityCard({
  avatarUrl,
  displayName,
  roleSubtitle,
  isVerified,
  onPickAvatar,
}: Props) {
  return (
    <View className="flex-row items-center gap-3 px-3.5 py-2.5 border-b border-[#DEE6F1]">
      <View className="w-[78px] h-[78px] rounded-[22px] bg-[#E2E8F0] relative">
        <Image
          source={avatarUrl ? { uri: avatarUrl } : require("../../../../../assets/no_image.jpg")}
          className="w-full h-full rounded-[22px]"
        />
        <Pressable
          className="absolute -right-0.5 -bottom-0.5 w-6 h-6 rounded-full bg-[#5B9BD5] items-center justify-center border-2 border-white active:opacity-80"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onPickAvatar}
        >
          <Ionicons name="create" size={12} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="flex-1">
        <Text className="text-[#172B46] font-heading text-[22px] font-bold leading-[27px]">
          {displayName}
        </Text>
        <Text className="text-[#5F7896] font-body text-sm mt-0.5">{roleSubtitle}</Text>

        {isVerified ? (
          <View className="mt-1.5 self-start rounded-full px-2.5 py-1 bg-[#EAF6EF]">
            <Text className="text-[#69AF8A] font-body text-xs font-bold">Verificada</Text>
          </View>
        ) : (
          <View className="mt-1.5 self-start rounded-full px-2.5 py-1 bg-[#FFF8E1]">
            <Text className="text-[#B8860B] font-body text-xs font-bold">Pendiente de verificación</Text>
          </View>
        )}
      </View>
    </View>
  );
}
