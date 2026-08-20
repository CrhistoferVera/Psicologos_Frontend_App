import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";

type Props = {
  coverUrl: string | null;
  onPick: () => void;
};

export default function CoverPicker({ coverUrl, onPick }: Props) {
  const { width } = useWindowDimensions();
  const coverWidth = width * 0.46;

  return (
    <View className="items-center py-3.5 gap-2 bg-[#F7FAFC]">
      <Pressable
        className="relative rounded-2xl overflow-hidden bg-[#E2EBF5] active:opacity-90"
        style={{ width: coverWidth, height: coverWidth * (16 / 9) }}
        accessibilityRole="button"
        onPress={onPick}
      >
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center gap-1.5">
            <Ionicons name="image-outline" size={28} color="#A0B4C8" />
            <Text className="text-[#A0B4C8] font-body text-[13px] font-semibold">Agregar portada</Text>
          </View>
        )}
        <View className="absolute bottom-2 right-2.5 flex-row items-center gap-1 bg-black/45 rounded-[20px] px-2.5 py-[5px]">
          <Ionicons name="camera" size={13} color="#FFFFFF" />
          <Text className="text-white font-body text-xs font-bold">{coverUrl ? "Cambiar" : "Agregar"}</Text>
        </View>
      </Pressable>
      <Text className="text-[#A0B4C8] font-body text-xs text-center leading-[17px]">
        Así te verán{"\n"}en el feed
      </Text>
    </View>
  );
}
