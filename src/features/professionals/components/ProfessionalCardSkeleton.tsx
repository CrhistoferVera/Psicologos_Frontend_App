import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

function useShimmer() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

export default function ProfessionalCardSkeleton() {
  const opacity = useShimmer();

  return (
    <Animated.View
      style={{ opacity }}
      className="rounded-2xl border border-slate-300 bg-white p-4"
    >
      <View className="flex-row gap-3">
        <View className="h-16 w-16 rounded-full bg-slate-200" />
        <View className="flex-1 gap-2 pt-1">
          <View className="h-4 w-2/3 rounded bg-slate-200" />
          <View className="h-3 w-1/2 rounded bg-slate-200" />
          <View className="h-3 w-1/4 rounded bg-slate-200" />
        </View>
      </View>
      <View className="mt-3 gap-2">
        <View className="h-3 w-full rounded bg-slate-200" />
        <View className="h-3 w-4/5 rounded bg-slate-200" />
      </View>
      <View className="mt-3 flex-row justify-between border-t border-slate-100 pt-3">
        <View className="h-4 w-20 rounded bg-slate-200" />
        <View className="h-4 w-16 rounded bg-slate-200" />
      </View>
    </Animated.View>
  );
}
