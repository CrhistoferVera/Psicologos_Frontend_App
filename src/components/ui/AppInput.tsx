import { StyleSheet, Text, TextInput, type TextStyle, View } from "react-native";
import { appTheme } from "../../theme/appTheme";

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  editable?: boolean;
  valueStyle?: TextStyle;
};

export default function AppInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  editable = true,
  valueStyle,
}: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={appTheme.colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        editable={editable}
        style={[styles.input, !editable && styles.inputDisabled, valueStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },

  label: {
    color: appTheme.colors.text,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },

  inputDisabled: {
    opacity: 0.55,
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    minHeight: 48,
    paddingHorizontal: 14,
    color: appTheme.colors.text,
    fontSize: 15,
    fontFamily: appTheme.fonts.body,
  },
});

