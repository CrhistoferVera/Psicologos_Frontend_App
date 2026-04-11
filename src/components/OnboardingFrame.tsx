import { useEffect, useRef } from "react";
import { Animated, Easing, View, Text, Pressable, Image } from "react-native";
import type { ReactNode } from "react";
import Screen from "./Screen";
import Dots from "./Dots";

const logo = require("../../assets/logo.png");

type OnboardingFrameProps = {
  step: number;
  title: string;
  description: string;
  icon: ReactNode;
  descriptionClassName?: string;
  onSkip: () => void;
  onNext: () => void;
};

export default function OnboardingFrame({
  step,
  title,
  description,
  icon,
  descriptionClassName = "",
  onSkip,
  onNext,
}: OnboardingFrameProps) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideAnim.setValue(40);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  return (
    <Screen className="pt-10">
      <View className="flex-row items-center justify-between mb-6">
        <Image source={logo} className="w-8 h-8" resizeMode="contain" />
        <Pressable onPress={onSkip}>
          <Text className="text-white font-bold text-xl">Saltar</Text>
        </Pressable>
      </View>

      <Animated.View
        style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        className="items-center justify-center"
      >
        <View className="mb-6">{icon}</View>
        <Text className="text-white text-3xl font-semibold text-center mb-3">
          {title}
        </Text>
        <Text
          className={`text-white text-center text-base leading-6 ${descriptionClassName}`}
        >
          {description}
        </Text>
      </Animated.View>

      <View className="flex-row items-center justify-between mb-14">
        <Dots count={3} activeIndex={step} />
        <Pressable
          onPress={onNext}
          className="w-16 h-16 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-black text-4xl">&gt;</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
