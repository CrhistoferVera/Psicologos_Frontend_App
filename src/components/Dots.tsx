import { View } from "react-native";

type DotsProps = {
  count?: number;
  activeIndex?: number;
};

export default function Dots({ count = 3, activeIndex = 0 }: DotsProps) {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <View
            key={`dot-${index}`}
            className={`${isActive ? "w-6" : "w-2"} h-2 rounded-full bg-white ${
              index === count - 1 ? "" : "mr-2"
            }`}
          />
        );
      })}
    </View>
  );
}
