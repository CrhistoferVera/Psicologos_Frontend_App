import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, type TextStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../theme/appTheme";

type Props = {
  label?: string;
  labelIcon?: keyof typeof Ionicons.glyphMap;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad" | "numeric";
  editable?: boolean;
  valueStyle?: TextStyle;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  showCheck?: boolean;
  hint?: string;
};

export default function AppInput({
  label,
  labelIcon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  showPasswordToggle = false,
  keyboardType = "default",
  editable = true,
  valueStyle,
  autoCapitalize = "none",
  showCheck = false,
  hint,
}: Props) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isSecure = secureTextEntry && !visible;
  const hasValue = value.length > 0;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <View style={styles.labelRow}>
          {labelIcon ? (
            <View style={styles.labelIconWrap}>
              <Ionicons name={labelIcon} size={13} color={appTheme.colors.primary} />
            </View>
          ) : null}
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.inputRow, !editable && styles.inputRowDisabled]}
        onPress={() => inputRef.current?.focus()}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A0AEC0"
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          autoCapitalize={autoCapitalize}
          editable={editable}
          style={[styles.input, valueStyle]}
        />

        {showCheck && hasValue ? (
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={styles.iconRight} />
        ) : null}

        {secureTextEntry && showPasswordToggle ? (
          <Pressable onPress={() => setVisible((v) => !v)} style={styles.iconRight}>
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={appTheme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </Pressable>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },
  labelIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: appTheme.colors.text,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    minHeight: 50,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputRowDisabled: {
    opacity: 0.55,
    backgroundColor: "#F1F5F9",
  },
  input: {
    flex: 1,
    color: appTheme.colors.text,
    fontSize: 14,
    fontFamily: appTheme.fonts.body,
    paddingVertical: 12,
  },
  iconRight: {
    marginLeft: 8,
  },
  hint: {
    color: appTheme.colors.textMuted,
    fontSize: 11,
    fontFamily: appTheme.fonts.body,
    marginTop: 4,
    marginLeft: 2,
  },
});
