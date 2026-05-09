import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Package } from "lucide-react-native";
import { appTheme } from "../../../theme/appTheme";

type Props =
  | { state: "loading" }
  | { state: "error"; message: string; onRetry: () => void }
  | { state: "empty" };

export function PackagesEmptyState(props: Props) {
  return (
    <View style={styles.wrap}>
      {props.state === "loading" && (
        <>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.text}>Cargando paquetes...</Text>
        </>
      )}

      {props.state === "error" && (
        <>
          <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.text}>{props.message}</Text>
          <Pressable style={styles.retryBtn} onPress={props.onRetry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </>
      )}

      {props.state === "empty" && (
        <>
          <Package size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.text}>No hay paquetes disponibles.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 32,
    backgroundColor: "#FFFFFF",
  },
  text: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: appTheme.colors.primary,
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
});
