import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import { RefundRequestModal } from "./RefundRequestModal";
import type { RefundRequestResult } from "../../../api/bookings";

type Props = {
  bookingId: string;
  scheduledStartAt: string;
  refundWindowExpiresAt: string;
  onSuccess: (result: RefundRequestResult) => void;
};

function useRefundCountdown(refundWindowExpiresAt: string) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  if (typeof window !== "undefined") {
    // Only tick in environments with timers
  }

  const expiresMs = new Date(refundWindowExpiresAt).getTime();
  const msLeft = Math.max(0, expiresMs - nowMs);
  const hoursLeft = Math.floor(msLeft / 3600000);
  const minutesLeft = Math.floor((msLeft % 3600000) / 60000);
  const isExpired = msLeft === 0;

  return { hoursLeft, minutesLeft, isExpired };
}

export function RefundRequestBanner({
  bookingId,
  scheduledStartAt,
  refundWindowExpiresAt,
  onSuccess,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [refundDone, setRefundDone] = useState(false);
  const { hoursLeft, minutesLeft, isExpired } = useRefundCountdown(refundWindowExpiresAt);

  if (refundDone) {
    return (
      <View style={styles.bannerSuccess}>
        <Ionicons name="checkmark-circle" size={16} color="#15803D" />
        <Text style={styles.bannerSuccessText}>
          Solicitud de reembolso enviada. Te avisaremos cuando se procese.
        </Text>
      </View>
    );
  }

  if (isExpired) return null;

  const deadlineText =
    hoursLeft > 0
      ? `${hoursLeft}h ${minutesLeft}m restantes`
      : `${minutesLeft} min restantes`;

  function handleSuccess(result: RefundRequestResult) {
    setModalVisible(false);
    setRefundDone(true);
    onSuccess(result);
  }

  return (
    <>
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Ionicons name="cash-outline" size={16} color="#15803D" />
          <View>
            <Text style={styles.bannerTitle}>Reembolso disponible</Text>
            <Text style={styles.bannerSub}>Tiempo restante: {deadlineText}</Text>
          </View>
        </View>
        <Pressable style={styles.refundBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.refundBtnText}>Solicitar</Text>
        </Pressable>
      </View>

      <RefundRequestModal
        visible={modalVisible}
        bookingId={bookingId}
        scheduledStartAt={scheduledStartAt}
        onClose={() => setModalVisible(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803D",
  },
  bannerSub: {
    fontSize: 11,
    color: "#166534",
    marginTop: 1,
  },
  refundBtn: {
    backgroundColor: "#15803D",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refundBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  bannerSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  bannerSuccessText: {
    fontSize: 12,
    color: "#15803D",
    flex: 1,
    fontWeight: "600",
  },
});
