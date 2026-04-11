import { Pressable, View, Text } from "react-native";

type CheckboxRowProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

export default function CheckboxRow({
  checked,
  onToggle,
  label,
}: CheckboxRowProps) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-start">
      <View
        className={`w-5 h-5 rounded border border-white/60 mr-3 items-center justify-center ${
          checked ? "bg-white" : "bg-transparent"
        }`}
      >
        {checked ? <View className="w-3 h-3 bg-black rounded-sm" /> : null}
      </View>
      <Text className="text-white/80 flex-1 text-lg">{label}</Text>
    </Pressable>
  );
}
