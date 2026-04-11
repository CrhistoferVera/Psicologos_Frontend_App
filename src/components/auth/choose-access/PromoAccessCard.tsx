import { Pressable, Text, View } from "react-native";
import HostessPreviewItem from "./HostessPreviewItem";

type PromoAccessCardProps = {
  onPrimaryPress: () => void;
};

const previewItems = [
  {
    imageUri: "https://i.pravatar.cc/500?img=47",
    badgeText: "Online",
    badgeTone: "green" as const,
    nameAge: "Linda, 22",
  },
  {
    imageUri: "https://i.pravatar.cc/500?img=44",
    badgeText: "Disponible",
    badgeTone: "red" as const,
    nameAge: "Anna, 22",
  },
  {
    imageUri: "https://i.pravatar.cc/500?img=48",
    badgeText: "Responde rapido",
    badgeTone: "yellow" as const,
    nameAge: "Sanya, 22",
  },
];

export default function PromoAccessCard({ onPrimaryPress }: PromoAccessCardProps) {
  return (
    <View className="mt-8 rounded-[30px] border border-white/10 bg-black/40 overflow-hidden">
      <View className="flex-row">
        {previewItems.map((item) => (
          <HostessPreviewItem
            key={item.nameAge}
            imageUri={item.imageUri}
            badgeText={item.badgeText}
            badgeTone={item.badgeTone}
            nameAge={item.nameAge}
          />
        ))}
      </View>

      <View className="px-4 pt-4 pb-5">
        <Pressable
          onPress={onPrimaryPress}
          className="bg-[#ef2f2f] rounded-full py-5 items-center active:opacity-80"
        >
          <Text className="text-white text-[18px] font-semibold">
            Ver amigas disponibles 🔥
          </Text>
        </Pressable>
        <Text className="text-white/70 text-center mt-4 text-[14px]">
          +12 anfitrionas conectadas ahora
        </Text>
      </View>
    </View>
  );
}
