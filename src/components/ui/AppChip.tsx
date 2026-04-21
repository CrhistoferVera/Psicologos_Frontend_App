import { Pressable, StyleSheet, Text } from "react-native";
import { appTheme } from "../../theme/appTheme";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export default function AppChip({ label, active = false, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.base, active && styles.active]}>
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  active: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  label: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "500",
  },
  activeLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});

