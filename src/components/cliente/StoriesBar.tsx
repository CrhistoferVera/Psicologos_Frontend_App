import { Animated, FlatList } from "react-native";
import StoryItem, { Story } from "./StoryItem";

const STORIES_BAR_H = 96;

type Props = {
  stories: Story[];
  scrollY: Animated.Value;
  onStoryPress: (story: Story) => void;
};

export default function StoriesBar({ stories, scrollY, onStoryPress }: Props) {
  const translateY = scrollY.interpolate({
    inputRange: [0, STORIES_BAR_H],
    outputRange: [0, -STORIES_BAR_H],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        transform: [{ translateY }],
        backgroundColor: "#111",
        borderBottomWidth: 1, borderBottomColor: "#222",
        paddingVertical: 10,
      }}
    >
      <FlatList
        data={stories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <StoryItem story={item} onPress={() => onStoryPress(item)} />
        )}
      />
    </Animated.View>
  );
}
