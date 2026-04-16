import { StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";

type Props = {
  label: string;
  value: string;
  highlight?: boolean;
};

export default function ProfessionalStatCard({ label, value, highlight = false }: Props) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueWrap}>
        <Text style={[styles.value, highlight && styles.valueHighlight]}>{value}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 100,
    justifyContent: "space-between",
  },
  label: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  valueWrap: {
    marginTop: 8,
  },
  value: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  valueHighlight: {
    color: appTheme.colors.success,
  },
});
