import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import GoogleLogo from "./GoogleLogo";
import { appTheme } from "../../theme/appTheme";

type Props = {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function GoogleButton({
  label = "Continuar con Google",
  loading = false,
  disabled = false,
  onPress,
}: Props) {
  const isDisabled = loading || disabled;

  return (
    <Pressable
      style={[styles.btn, isDisabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={appTheme.colors.primary} />
      ) : (
        <GoogleLogo size={18} />
      )}
      <Text style={styles.text}>{loading ? "Conectando..." : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  text: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    fontWeight: "600",
  },
});
