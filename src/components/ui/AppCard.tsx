import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { appTheme } from "../../theme/appTheme";

type Props = {
  children: ReactNode;
};

export default function AppCard({ children }: Props) {
  return <View style={styles.card}>{children}</View>;
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

