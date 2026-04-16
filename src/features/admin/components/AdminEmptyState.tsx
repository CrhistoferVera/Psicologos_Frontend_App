import { StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";

type Props = {
  title: string;
  description: string;
};

export default function AdminEmptyState({ title, description }: Props) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.dot} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
    gap: 8,
  },
  dot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F1FA",
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
