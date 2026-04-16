import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { appTheme } from "../../theme/appTheme";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export default function AppCard({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 16,
    gap: 10,
  },
});

