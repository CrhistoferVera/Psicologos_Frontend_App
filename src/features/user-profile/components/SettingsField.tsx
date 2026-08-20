import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, View, type KeyboardTypeOptions } from "react-native";

type Props = {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  hint?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export default function SettingsField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  hint,
  multiline = false,
  keyboardType,
  autoCapitalize,
}: Props) {
  return (
    <View className="gap-1.5">
      <Text className="text-[#020617] font-body text-[13px] font-semibold">{label}</Text>

      <View
        className={`min-h-[46px] rounded-xl border px-3 py-2.5 flex-row items-center gap-2 ${
          editable ? "border-[#CBD5E1] bg-white" : "border-[#E2E8F0] bg-[#F1F5F9]"
        }`}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          editable={editable}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className={`flex-1 font-body text-sm py-0 ${editable ? "text-[#020617]" : "text-[#64748B]"} ${
            multiline ? "h-[92px]" : ""
          }`}
          style={multiline ? { textAlignVertical: "top" } : undefined}
        />
        {!editable ? <Ionicons name="lock-closed" size={16} color="#94A3B8" /> : null}
      </View>

      {hint ? <Text className="text-[#64748B] font-body text-xs">{hint}</Text> : null}
    </View>
  );
}
