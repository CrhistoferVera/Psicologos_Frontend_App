import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { appTheme } from "../../../theme/appTheme";

export default function StripePaymentScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/(user)/credits" as any);
  }, []);
  return (
    <View style={styles.center}>
      <Text style={styles.text}>Redirigiendo...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: appTheme.colors.background },
  text: { color: appTheme.colors.textMuted, fontFamily: appTheme.fonts.body, fontSize: 14 },
});
