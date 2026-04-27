import { StyleSheet, Text, View } from "react-native";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";

export default function CreditsScreen() {
  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Comprar créditos</Text>
        <Text style={styles.subtitle}>
          Los pagos con tarjeta solo están disponibles en la app móvil.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    textAlign: "center",
  },
});
