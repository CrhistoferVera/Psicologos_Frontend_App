import { StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";

type Props = {
  title: string;
  description?: string;
};

export default function AdminSectionCard({ title, description }: Props) {
  return (
    <AppCard>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
});
