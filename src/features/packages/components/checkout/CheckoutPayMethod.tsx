import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../../theme/appTheme";

type Props = {
  isBolivian: boolean;
  paying: boolean;
  onPayQr: () => void;
  onPayStripe: () => void;
};

export function CheckoutPayMethod({ isBolivian, paying, onPayQr, onPayStripe }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Método de pago</Text>

      {isBolivian ? (
        <Pressable
          style={[styles.btn, paying && styles.disabled]}
          disabled={paying}
          onPress={onPayQr}
        >
          <LinearGradient
            colors={["#0EA5E9", "#0284C7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="qr-code" size={22} color="#0EA5E9" />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title}>
                {paying ? "Generando QR..." : "Pagar con QR Baneco"}
              </Text>
              <Text style={styles.sub}>Escanea y paga al instante</Text>
            </View>
            {paying
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            }
          </LinearGradient>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.btn, paying && styles.disabled]}
          disabled={paying}
          onPress={onPayStripe}
        >
          <LinearGradient
            colors={["#7C3AED", "#635BFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="card" size={22} color="#635BFF" />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title}>
                {paying ? "Procesando..." : "Pagar con Stripe"}
              </Text>
              <Text style={styles.sub}>Tarjeta, Apple Pay y más</Text>
            </View>
            {paying
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            }
          </LinearGradient>
        </Pressable>
      )}

      <View style={styles.securityRow}>
        <Ionicons name="shield-checkmark" size={14} color={appTheme.colors.success} />
        <Text style={styles.securityText}>Pago 100% seguro y encriptado</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  label: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.heading,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  btn: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1, gap: 3 },
  title: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  sub: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  disabled: { opacity: 0.65 },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  securityText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
});
