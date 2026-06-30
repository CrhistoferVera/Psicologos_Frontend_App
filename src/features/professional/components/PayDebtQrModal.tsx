import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import { formatBob } from "../../../utils/money";
import { apiCreateDebtQr, type DebtQrPayment } from "../../../api/wallet";
import { apiGetQrPackageStatus } from "../../../api/package";

type Props = {
  visible: boolean;
  debtBob: number;
  onClose: () => void;
  onSuccess: () => void;
};

type ModalState = "loading" | "pending" | "paid" | "error";

const POLL_INTERVAL_MS = 5000;

export function PayDebtQrModal({ visible, debtBob, onClose, onSuccess }: Props) {
  const [state, setState] = useState<ModalState>("loading");
  const [qr, setQr] = useState<DebtQrPayment | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    if (!visible) {
      stopPolling();
      setState("loading");
      setQr(null);
      setErrorMsg(null);
      return;
    }

    async function initQr() {
      try {
        const data = await apiCreateDebtQr();
        setQr(data);
        setState("pending");

        pollRef.current = setInterval(async () => {
          try {
            const { status } = await apiGetQrPackageStatus(data.qrId);
            if (status === "PAID") {
              stopPolling();
              setState("paid");
              onSuccess();
            } else if (status === "CANCELED") {
              stopPolling();
              setErrorMsg("El QR fue cancelado o venció.");
              setState("error");
            }
          } catch {
            // silently ignore transient polling errors
          }
        }, POLL_INTERVAL_MS);
      } catch (err: any) {
        setErrorMsg(err?.message ?? "No se pudo generar el QR.");
        setState("error");
      }
    }

    void initQr();
    return () => stopPolling();
  }, [visible]);

  function handleClose() {
    stopPolling();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Pagar deuda en BOB</Text>
          <Text style={styles.subtitle}>Monto: {formatBob(debtBob)}</Text>

          {state === "loading" && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={appTheme.colors.primary} />
              <Text style={styles.hintText}>Generando QR...</Text>
            </View>
          )}

          {state === "pending" && qr && (
            <>
              <Text style={styles.instruction}>
                Escanea desde tu app bancaria para saldar la deuda
              </Text>

              <View style={styles.qrWrap}>
                <Image
                  source={{ uri: `data:image/png;base64,${qr.qrImage}` }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.dueDate}>Vence: {qr.dueDate}</Text>

              <View style={styles.pollingBadge}>
                <ActivityIndicator size="small" color={appTheme.colors.primary} />
                <Text style={styles.pollingText}>Esperando confirmación de pago...</Text>
              </View>
            </>
          )}

          {state === "paid" && (
            <View style={styles.centerBox}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={56} color="#15803D" />
              </View>
              <Text style={styles.successTitle}>¡Pago recibido!</Text>
              <Text style={styles.successText}>Tu deuda en BOB ha sido saldada.</Text>
            </View>
          )}

          {state === "error" && (
            <View style={styles.centerBox}>
              <Ionicons name="close-circle-outline" size={48} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <Pressable
            style={[styles.closeBtn, state === "paid" && styles.closeBtnSuccess]}
            onPress={handleClose}
          >
            <Text style={styles.closeBtnText}>
              {state === "paid" ? "Cerrar" : "Cancelar"}
            </Text>
          </Pressable>
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
    color: "#DC2626",
    fontFamily: appTheme.fonts.heading,
  },
  instruction: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  qrWrap: {
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qrImage: {
    width: 210,
    height: 210,
    borderRadius: 8,
  },
  dueDate: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
  },
  pollingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
  },
  pollingText: {
    color: appTheme.colors.primary,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: appTheme.fonts.body,
  },
  centerBox: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 24,
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
  hintText: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
    marginTop: 8,
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
});
