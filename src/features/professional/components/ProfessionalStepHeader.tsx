import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";

type Props = {
  currentStep: number;
  totalSteps: number;
  title: string;
};

export default function ProfessionalStepHeader({ currentStep, totalSteps, title }: Props) {
  const safeCurrent = Math.max(1, Math.min(currentStep, totalSteps));
  const progress = (safeCurrent / totalSteps) * 100;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.kicker}>Paso {safeCurrent} de {totalSteps}</Text>
        <Text style={styles.percent}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  percent: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#E6F2EC",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: appTheme.colors.success,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
});
