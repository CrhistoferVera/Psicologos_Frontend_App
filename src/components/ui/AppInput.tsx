import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, type TextStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme/appTheme";

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  editable?: boolean;
  valueStyle?: TextStyle;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export default function AppInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  showPasswordToggle = false,
  keyboardType = "default",
  editable = true,
  valueStyle,
  autoCapitalize = "none",
}: Props) {
  const [visible, setVisible] = useState(false);
  const isSecure = secureTextEntry && !visible;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={appTheme.colors.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          autoCapitalize={autoCapitalize}
          editable={editable}
          style={[
            styles.input,
            showPasswordToggle && styles.inputWithIcon,
            !editable && styles.inputDisabled,
            valueStyle,
          ]}
        />

        {secureTextEntry && showPasswordToggle ? (
          <Pressable style={styles.eyeBtn} onPress={() => setVisible((v) => !v)}>
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={appTheme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
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

  inputRow: {
    position: "relative",
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

  inputWithIcon: {
    paddingRight: 44,
  },

  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
});
