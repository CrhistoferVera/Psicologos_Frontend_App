import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNoShowTimer } from "../../../hooks/useNoShowTimer";
import { reportNoShow, type NoShowType } from "../../../api/bookings";

type Props = {
  bookingId: string;
  scheduledStartAt: string;
  graceMinutes: number;
  isProfessional: boolean;
  onReported: (result: { noShowType: NoShowType; refundWindowExpiresAt?: string | null }) => void;
};

const STORAGE_KEY = (id: string) => `no_show_extension_${id}`;

export function NoShowBanner({ bookingId, scheduledStartAt, graceMinutes, isProfessional, onReported }: Props) {
  const [extensionDeadline, setExtensionDeadline] = useState<number | null>(null);
  const [hasExtended, setHasExtended] = useState(false);
  const { canReport, minutesLeft, secondsLeft } = useNoShowTimer(scheduledStartAt, graceMinutes, extensionDeadline);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore extension state on mount (survives navigation)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY(bookingId)).then((raw) => {
      if (!raw) return;
      const { deadline } = JSON.parse(raw) as { deadline: number };
      if (deadline > Date.now()) {
        setExtensionDeadline(deadline);
        setHasExtended(true);
      } else {
        AsyncStorage.removeItem(STORAGE_KEY(bookingId));
      }
    });
  }, [bookingId]);

  const absentParty = isProfessional ? "el cliente" : "el psicólogo";
  const countdownText =
    minutesLeft > 0
      ? `${minutesLeft}m ${String(secondsLeft).padStart(2, "0")}s`
      : `${secondsLeft}s`;

  async function handleKeepWaiting() {
    const deadline = Date.now() + graceMinutes * 60_000;
    await AsyncStorage.setItem(STORAGE_KEY(bookingId), JSON.stringify({ deadline }));
    setExtensionDeadline(deadline);
    setHasExtended(true);
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const result = await reportNoShow(bookingId);
      await AsyncStorage.removeItem(STORAGE_KEY(bookingId));
      setModalVisible(false);
      onReported(result);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "No se pudo reportar la ausencia.");
    } finally {
      setLoading(false);
    }
  }

  if (canReport) {
    return (
      <>
        <View style={styles.bannerActive}>
          <View style={styles.bannerTop}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.bannerActiveText}>
              {isProfessional
                ? "El cliente no se ha presentado"
                : "El psicólogo no se ha presentado"}
            </Text>
          </View>
          <View style={styles.bannerActions}>
            {!hasExtended && (
              <Pressable style={styles.waitBtn} onPress={handleKeepWaiting}>
                <Text style={styles.waitBtnText}>Seguir esperando</Text>
              </Pressable>
            )}
            <Pressable style={styles.reportBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.reportBtnText}>Reportar</Text>
            </Pressable>
          </View>
        </View>

        <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.overlay}>
            <View style={styles.dialog}>
              <Ionicons name="alert-circle-outline" size={36} color="#DC2626" style={{ alignSelf: "center", marginBottom: 12 }} />

              <Text style={styles.dialogTitle}>Reportar ausencia</Text>
              <Text style={styles.dialogMessage}>
                ¿Confirmas que {absentParty} no se presentó a la sesión?{"\n\n"}
                {!isProfessional
                  ? "Se aplicará una multa al psicólogo y podrás solicitar un reembolso."
                  : "El psicólogo recibirá el pago de la sesión aunque no hayas asistido."}
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.dialogActions}>
                <Pressable
                  style={[styles.btnCancel, loading && { opacity: 0.5 }]}
                  onPress={() => setModalVisible(false)}
                  disabled={loading}
                >
                  <Text style={styles.btnCancelText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  style={[styles.btnConfirm, loading && { opacity: 0.5 }]}
                  onPress={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnConfirmText}>Sí, reportar</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <View style={styles.bannerCountdown}>
      <Ionicons name="time-outline" size={14} color="#92400E" />
      <Text style={styles.bannerCountdownText}>
        {extensionDeadline
          ? `Esperando ${graceMinutes} min más · ${countdownText}`
          : isProfessional
            ? `El cliente tiene ${countdownText} para conectarse`
            : `El psicólogo tiene ${countdownText} para conectarse`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerCountdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  bannerCountdownText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
    flex: 1,
  },
  bannerActive: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
    gap: 8,
  },
  bannerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerActiveText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
    flex: 1,
  },
  bannerActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  waitBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  waitBtnText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "600",
  },
  reportBtn: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reportBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  dialogMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 12,
  },
  dialogActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
