import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";

type Props = {
  avatarUrl: string | null;
  initials: string;
  onPress: () => void;
};

export default function AvatarPicker({ avatarUrl, initials, onPress }: Props) {
  return (
    <Pressable
      className="self-center w-[90px] h-[90px] rounded-full my-2"
      accessibilityRole="button"
      onPress={onPress}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} className="w-full h-full rounded-full" />
      ) : (
        <View className="w-full h-full rounded-full bg-[#E2E8F0] items-center justify-center">
          <Text className="text-[#020617] font-heading text-[28px] font-bold">{initials}</Text>
        </View>
      )}
      <View className="absolute right-0 bottom-0 w-7 h-7 rounded-full bg-[#5B9BD5] items-center justify-center border-2 border-white">
        <Ionicons name="camera" size={14} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}
