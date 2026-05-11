import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appTheme } from "../../../theme/appTheme";
import { useAuth } from "../../../context/AuthContext";
import { useUserRegion } from "../../../hooks/useUserRegion";
import { formatBob, formatUsd } from "../../../utils/money";
import {
  apiInitQrPackagePurchase,
  apiGetQrPackageStatus,
  apiInitStripePackagePurchase,
  apiGetStripeDepositStatus,
} from "../../../api/package";
import { CheckoutPackageCard } from "../components/checkout/CheckoutPackageCard";
import { CheckoutPayMethod } from "../components/checkout/CheckoutPayMethod";
import { CheckoutQrPending } from "../components/checkout/CheckoutQrPending";
import {
  CheckoutStatePending,
  CheckoutStatePaid,
  CheckoutStateCanceled,
} from "../components/checkout/CheckoutStates";

type PayStatus = "NONE" | "PENDING" | "PAID" | "CANCELED";

export default function PackageCheckoutScreen() {
  const { packageId, packageName, priceBob, priceUsd } =
    useLocalSearchParams<{
      packageId: string;
      packageName: string;
      priceBob: string;
      priceUsd: string;
    }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isBolivian } = useUserRegion();
  const canDetermineRegion = Boolean((user?.phoneDialCode ?? "").trim());
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [payStatus, setPayStatus] = useState<PayStatus>("NONE");
  const [qrData, setQrData] = useState<{ qrImage: string | null; qrId: string; amount: number } | null>(null);
  const [stripeDepositId, setStripeDepositId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const qrPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stripePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (payStatus === "PENDING" && qrData?.qrId) {
      qrPollingRef.current = setInterval(async () => {
        try {
          const res = await apiGetQrPackageStatus(qrData.qrId);
          if (res.status === "PAID") { setPayStatus("PAID"); clearInterval(qrPollingRef.current!); }
          else if (res.status === "CANCELED") { setPayStatus("CANCELED"); clearInterval(qrPollingRef.current!); }
        } catch { /* silent */ }
      }, 3000);
    }
    return () => { if (qrPollingRef.current) clearInterval(qrPollingRef.current); };
  }, [payStatus, qrData?.qrId]);

  useEffect(() => {
    if (payStatus === "PENDING" && stripeDepositId) {
      stripePollingRef.current = setInterval(async () => {
        try {
          const res = await apiGetStripeDepositStatus(stripeDepositId);
          if (res.status === "PAID") { setPayStatus("PAID"); clearInterval(stripePollingRef.current!); }
          else if (res.status === "CANCELED") { setPayStatus("CANCELED"); clearInterval(stripePollingRef.current!); }
        } catch { /* silent */ }
      }, 3000);
    }
    return () => { if (stripePollingRef.current) clearInterval(stripePollingRef.current); };
  }, [payStatus, stripeDepositId]);

  async function handlePayQr() {
    if (!canDetermineRegion) return;
    if (!packageId) return;
    try {
      setPaying(true);
      const data = await apiInitQrPackagePurchase(packageId);
      setQrData({ qrImage: data.qrImage, qrId: data.qrId, amount: data.amount });
      setPayStatus("PENDING");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo generar el QR.");
    } finally {
      setPaying(false);
    }
  }

  async function handlePayStripe() {
    if (!canDetermineRegion) return;
    if (!packageId) return;
    try {
      setPaying(true);
      const { clientSecret, customerId, depositId } = await apiInitStripePackagePurchase(packageId);
      setStripeDepositId(depositId);

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "SanaMente",
        customerId,
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : undefined,
          email: user?.email ?? undefined,
        },
        appearance: { colors: { primary: appTheme.colors.primary } },
      });

      if (initError) { Alert.alert("Error", initError.message); return; }

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") Alert.alert("Pago fallido", presentError.message);
        return;
      }
      setPayStatus("PENDING");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo iniciar el pago.");
    } finally {
      setPaying(false);
    }
  }

  const displayPrice = !canDetermineRegion
    ? "Completa tu país y teléfono para continuar."
    : isBolivian
      ? formatBob(priceBob)
      : formatUsd(priceUsd);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={appTheme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Comprar paquete</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>

        <CheckoutPackageCard
          name={packageName ?? ""}
          displayPrice={displayPrice}
        />
        {!canDetermineRegion ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>Completa tu país y teléfono para continuar.</Text>
          </View>
        ) : null}

        {payStatus === "NONE" && canDetermineRegion && (
          <CheckoutPayMethod
            isBolivian={isBolivian}
            paying={paying}
            onPayQr={() => void handlePayQr()}
            onPayStripe={() => void handlePayStripe()}
          />
        )}

        {payStatus === "PENDING" && qrData && (
          <CheckoutQrPending qrImage={qrData.qrImage} amount={qrData.amount} />
        )}

        {payStatus === "PENDING" && !qrData && <CheckoutStatePending />}

        {payStatus === "PAID" && (
          <CheckoutStatePaid
            displayAmount={displayPrice}
            onBack={() => router.back()}
          />
        )}

        {payStatus === "CANCELED" && (
          <CheckoutStateCanceled onRetry={() => setPayStatus("NONE")} />
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: appTheme.fonts.heading,
    color: appTheme.colors.text,
  },
  page: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  warningBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    padding: 12,
  },
  warningText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
});
