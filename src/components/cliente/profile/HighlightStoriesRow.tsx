import type { HighlightStory } from "@/src/types/anfitrionaProfile";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

type Props = {
  stories: HighlightStory[];
};

function HighlightItem({ item }: { item: HighlightStory }) {
  return (
    <TouchableOpacity style={{ alignItems: "center", marginRight: 16 }}>
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: "#1f1f2e",
          borderWidth: 2,
          borderColor: item.locked ? "#4b5563" : "#ec4899",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Text style={{ fontSize: 28 }}>{item.emoji}</Text>

        {item.locked && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: "#D11B1B",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: "#111",
            }}
          >
            <Text style={{ fontSize: 10 }}>🔒</Text>
          </View>
        )}
      </View>

      <Text
        style={{ color: "white", fontSize: 11, marginTop: 6, textAlign: "center", maxWidth: 70 }}
        numberOfLines={1}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );
}

export default function HighlightStoriesRow({ stories }: Props) {
  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <Text
        style={{
          color: "#9ca3af",
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 1.2,
          marginBottom: 14,
        }}
      >
        HISTORIAS DESTACADAS
      </Text>

      <FlatList
        data={stories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HighlightItem item={item} />}
      />
    </View>
  );
}
