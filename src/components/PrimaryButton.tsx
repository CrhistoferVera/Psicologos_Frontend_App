import { Pressable, Text } from "react-native";
import type { PressableProps } from "react-native";

type PrimaryButtonProps = {
  title: string;
  onPress?: PressableProps["onPress"];
  disabled?: boolean;
  className?: string;
};

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  className = "",
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`bg-red-600 rounded-full py-4 items-center ${
        disabled ? "opacity-50" : "opacity-100"
      } ${className}`}
    >
      <Text className="text-white text-xl font-semibold">{title}</Text>
    </Pressable>
  );
}
