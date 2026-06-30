import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import { formatUsd } from "../../../utils/money";
import { apiCreateDebtStripeIntent } from "../../../api/wallet";

type Props = {
  visible: boolean;
  debtUsd: number;
  onClose: () => void;
  onSuccess: () => void;
};

type ModalState = "idle" | "loading" | "paid" | "error";

export function PayDebtStripeModal({ visible, debtUsd, onClose, onSuccess }: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [state, setState] = useState<ModalState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setState("idle");
      setErrorMsg(null);
      return;
    }

    void openStripe();
  }, [visible]);

  async function openStripe() {
    try {
      setState("loading");

      const { clientSecret, ephemeralKey } = await apiCreateDebtStripeIntent();

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "SanaMente",
        paymentIntentClientSecret: clientSecret,
        customerEphemeralKeySecret: ephemeralKey,
        appearance: { colors: { primary: appTheme.colors.primary } },
      });

      if (initError) {
        setErrorMsg(initError.message);
        setState("error");
        return;
      }

      // presentPaymentSheet bloquea hasta que el usuario termina o cancela
      const { error: presentError } = await presentPaymentSheet();

      if (!presentError) {
        setState("paid");
        onSuccess();
        return;
      }

      if (presentError.code === "Canceled") {
        // El usuario cerró el sheet manualmente — cerrar silenciosamente
        onClose();
        return;
      }

      setErrorMsg(presentError.message);
      setState("error");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "No se pudo iniciar el pago.");
      setState("error");
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Pagar deuda en USD</Text>
          <Text style={styles.subtitle}>Monto: {formatUsd(debtUsd)}</Text>

          {state === "loading" && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={appTheme.colors.primary} />
              <Text style={styles.hintText}>Preparando pago con tarjeta...</Text>
            </View>
          )}

          {state === "paid" && (
            <View style={styles.centerBox}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={56} color="#15803D" />
              </View>
              <Text style={styles.successTitle}>¡Pago recibido!</Text>
              <Text style={styles.successText}>Tu deuda en USD ha sido saldada.</Text>
            </View>
          )}

          {state === "error" && (
            <View style={styles.centerBox}>
              <Ionicons name="close-circle-outline" size={48} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
              <Pressable style={styles.retryBtn} onPress={openStripe}>
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </Pressable>
            </View>
          )}

          {(state === "paid" || state === "error") && (
            <Pressable
              style={[styles.closeBtn, state === "paid" && styles.closeBtnSuccess]}
              onPress={onClose}
            >
              <Text style={[styles.closeBtnText, state === "paid" && styles.closeBtnTextSuccess]}>
                {state === "paid" ? "Cerrar" : "Cancelar"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    gap: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E4D7B",
    fontFamily: appTheme.fonts.heading,
  },
  centerBox: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 24,
  },
  hintText: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
    marginTop: 8,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#15803D",
    fontFamily: appTheme.fonts.heading,
  },
  successText: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#1E4D7B",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  closeBtn: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  closeBtnSuccess: {
    backgroundColor: "#15803D",
    borderColor: "#15803D",
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  closeBtnTextSuccess: {
    color: "#fff",
  },
});
