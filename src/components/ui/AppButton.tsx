import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { appTheme } from "../../theme/appTheme";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
};

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const variantStyle = stylesByVariant[variant];

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.base,
        variantStyle.button,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : appTheme.colors.primary} />
      ) : (
        <Text style={[styles.label, variantStyle.label]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: appTheme.radius.lg,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 15,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
});

const variantStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: appTheme.colors.primary,
  },
  primaryLabel: {
    color: "#FFFFFF",
  },
  secondaryButton: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  secondaryLabel: {
    color: appTheme.colors.text,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  ghostLabel: {
    color: appTheme.colors.primary,
  },
});

const stylesByVariant: Record<Variant, { button: ViewStyle; label: any }> = {
  primary: { button: variantStyles.primaryButton, label: variantStyles.primaryLabel },
  secondary: { button: variantStyles.secondaryButton, label: variantStyles.secondaryLabel },
  ghost: { button: variantStyles.ghostButton, label: variantStyles.ghostLabel },
};
