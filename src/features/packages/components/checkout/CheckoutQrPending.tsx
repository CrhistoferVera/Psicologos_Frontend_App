import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../../theme/appTheme";

type Props = {
  qrImage: string | null;
  amount: number;
};

export function CheckoutQrPending({ qrImage, amount }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Escanea para pagar</Text>
      <Text style={styles.amount}>Bs {amount.toFixed(2)}</Text>

      <View style={styles.imageWrap}>
        {qrImage ? (
          <Image
            source={{ uri: `data:image/png;base64,${qrImage}` }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="qr-code-outline" size={64} color="#CBD5E1" />
          </View>
        )}
      </View>

      <View style={styles.pendingBadge}>
        <ActivityIndicator size="small" color={appTheme.colors.primary} />
        <Text style={styles.pendingText}>Esperando confirmación...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  amount: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 28,
    fontWeight: "700",
  },
  imageWrap: {
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  placeholder: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
  },
  pendingText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "600",
  },
});
