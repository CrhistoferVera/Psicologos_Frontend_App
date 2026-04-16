import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";

type Tone = "neutral" | "positive" | "warning" | "danger";

type Props = {
  label: string;
  tone?: Tone;
};

const palette: Record<Tone, { bg: string; text: string }> = {
  neutral: { bg: "#EEF2F7", text: appTheme.colors.textMuted },
  positive: { bg: "rgba(107, 175, 138, 0.16)", text: appTheme.colors.success },
  warning: { bg: "#FEF3C7", text: "#B45309" },
  danger: { bg: "#FEE2E2", text: appTheme.colors.danger },
};

export default function AdminStatusBadge({ label, tone = "neutral" }: Props) {
  return (
    <View style={[styles.wrap, { backgroundColor: palette[tone].bg }]}>
      <Text style={[styles.label, { color: palette[tone].text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
});
