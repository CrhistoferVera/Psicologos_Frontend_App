import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../../theme/appTheme";

// ── Procesando (Stripe) ──────────────────────────────────────────────────────
export function CheckoutStatePending() {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: "#EFF6FF" }]}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
      <Text style={styles.title}>Procesando pago...</Text>
      <Text style={styles.sub}>Estamos confirmando tu pago con Stripe.</Text>
    </View>
  );
}

// ── Pago confirmado ──────────────────────────────────────────────────────────
type PaidProps = { displayCredits: string; onBack: () => void };

export function CheckoutStatePaid({ displayCredits, onBack }: PaidProps) {
  return (
    <View style={styles.card}>
      <LinearGradient colors={["#D1FAE5", "#ECFDF5"]} style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={52} color="#10B981" />
      </LinearGradient>
      <Text style={[styles.title, { color: "#10B981" }]}>¡Pago confirmado!</Text>
      <Text style={styles.sub}>
        {displayCredits} unidades fueron agregadas a tu wallet.
      </Text>
      <Pressable style={styles.primaryBtn} onPress={onBack}>
        <Text style={styles.btnText}>Volver a paquetes</Text>
      </Pressable>
    </View>
  );
}

// ── Pago cancelado ───────────────────────────────────────────────────────────
type CanceledProps = { onRetry: () => void };

export function CheckoutStateCanceled({ onRetry }: CanceledProps) {
  return (
    <View style={styles.card}>
      <LinearGradient colors={["#FEE2E2", "#FFF1F2"]} style={styles.iconWrap}>
        <Ionicons name="close-circle" size={52} color={appTheme.colors.danger} />
      </LinearGradient>
      <Text style={[styles.title, { color: appTheme.colors.danger }]}>Pago cancelado</Text>
      <Text style={styles.sub}>No se realizó ningún cobro.</Text>
      <Pressable style={styles.dangerBtn} onPress={onRetry}>
        <Text style={styles.btnText}>Intentar de nuevo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  sub: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 99,
  },
  dangerBtn: {
    marginTop: 8,
    backgroundColor: appTheme.colors.danger,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 99,
  },
  btnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
});

