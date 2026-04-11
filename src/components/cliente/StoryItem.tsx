import { Image, Text, TouchableOpacity, View } from "react-native";

export type Story = {
  id: string;
  name: string;
  avatar: string;
  isOnline?: boolean;
};

export default function StoryItem({ story, onPress }: { story: Story; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="items-center mr-4">
      <View style={{ position: "relative" }}>
        <View
          className="w-16 h-16 rounded-full"
          style={{ borderWidth: 2, borderColor: "#ec4899" }}
        >
          <Image
            source={{ uri: story.avatar }}
            style={{ width: "100%", height: "100%", borderRadius: 9999 }}
          />
        </View>

        {story.isOnline && (
          <View
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 13,
              height: 13,
              borderRadius: 7,
              backgroundColor: "#22c55e",
              borderWidth: 2,
              borderColor: "#111",
            }}
          />
        )}
      </View>

      <Text className="text-white text-xs mt-1 w-16 text-center" numberOfLines={1}>
        {story.name}
      </Text>
    </TouchableOpacity>
  );
}
