import { Pressable, Text, View } from "react-native";

type SecondaryAccessLinksProps = {
  onHostessPress: () => void;
  onAdminPress: () => void;
};

export default function SecondaryAccessLinks({
  onHostessPress,
  onAdminPress,
}: SecondaryAccessLinksProps) {
  return (
    <View className="flex-row items-center justify-center mt-7  gap-4">
      <Pressable onPress={onHostessPress} className="px-4 py-2">
        <Text className="text-white/85 text-[18px]">Soy anfitriona</Text>
      </Pressable>

      <View className="h-6 w-px bg-white/20 mx-4" />

      <Pressable onPress={onAdminPress} className="px-4 py-2">
        <Text className="text-white/85 text-[18px]">Admin</Text>
      </Pressable>
    </View>
  );
}
