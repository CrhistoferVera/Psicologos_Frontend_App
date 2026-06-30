import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { apiGetMyBalance, apiGetPenaltyTransactions, type WalletBalance, type PenaltyTransaction } from "../../../api/wallet";
import { formatBob, formatUsd } from "../../../utils/money";
import { PayDebtQrModal } from "../components/PayDebtQrModal";
import { PayDebtStripeModal } from "../components/PayDebtStripeModal";
import PenaltyTransactionCard from "../components/PenaltyTransactionCard";

export default function DebtPaymentScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [penalties, setPenalties] = useState<PenaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);

  function reload() {
    setLoading(true);
    void Promise.all([apiGetMyBalance(), apiGetPenaltyTransactions()])
      .then(([balance, txs]) => { setWallet(balance); setPenalties(txs); })
      .finally(() => setLoading(false));
  }

  useFocusEffect(
    useCallback(() => {
      void Promise.all([apiGetMyBalance(), apiGetPenaltyTransactions()])
        .then(([balance, txs]) => { setWallet(balance); setPenalties(txs); })
        .finally(() => setLoading(false));
    }, []),
  );

  const debtBob = Number(wallet?.debtBob ?? 0);
  const debtUsd = Number(wallet?.debtUsd ?? 0);
  const isBlocked = wallet?.isBlocked ?? false;

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="warning" size={36} color="#DC2626" />
        </View>

        <Text style={styles.title}>
          {isBlocked ? "Cuenta bloqueada" : "Deuda pendiente"}
        </Text>

        <Text style={styles.subtitle}>
          {isBlocked
            ? "Tu perfil no es visible para los clientes hasta que saldas la deuda."
            : "Tienes una deuda pendiente por no presentarte a una sesión."}
        </Text>

        {loading ? (
          <ActivityIndicator color={appTheme.colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            <View style={styles.debtCards}>
              {debtBob > 0 && (
                <View style={styles.debtCard}>
                  <Text style={styles.debtLabel}>Deuda en BOB</Text>
                  <Text style={styles.debtAmount}>{formatBob(debtBob)}</Text>
                  <Pressable style={styles.payBtn} onPress={() => setShowQrModal(true)}>
                    <Ionicons name="qr-code-outline" size={16} color="#fff" />
                    <Text style={styles.payBtnText}>Pagar con QR</Text>
                  </Pressable>
                </View>
              )}
              {debtUsd > 0 && (
                <View style={styles.debtCard}>
                  <Text style={styles.debtLabel}>Deuda en USD</Text>
                  <Text style={styles.debtAmount}>{formatUsd(debtUsd)}</Text>
                  <Pressable style={[styles.payBtn, styles.payBtnStripe]} onPress={() => setShowStripeModal(true)}>
                    <Ionicons name="card-outline" size={16} color="#fff" />
                    <Text style={styles.payBtnText}>Pagar con tarjeta</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {penalties.length > 0 && (
              <View style={styles.penaltiesSection}>
                <View style={styles.penaltiesHeader}>
                  <View style={styles.penaltiesTitleRow}>
                    <Ionicons name="receipt-outline" size={16} color="#DC2626" />
                    <Text style={styles.penaltiesTitle}>Detalle de penalidades</Text>
                  </View>
                  {penalties.length > 3 && (
                    <Pressable onPress={() => router.push("/(professional)/penalty-history")}>
                      <Text style={styles.verMasLink}>Ver más</Text>
                    </Pressable>
                  )}
                </View>
                {penalties.slice(0, 3).map((tx) => (
                  <PenaltyTransactionCard key={tx.id} tx={tx} />
                ))}
                {penalties.length > 3 && (
                  <Pressable
                    style={styles.verMasBtn}
                    onPress={() => router.push("/(professional)/penalty-history")}
                  >
                    <Text style={styles.verMasBtnText}>Ver historial completo</Text>
                    <Ionicons name="chevron-forward" size={14} color="#DC2626" />
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="help-circle-outline" size={16} color={appTheme.colors.textMuted} />
                <Text style={styles.infoTitle}>¿Por qué tengo esta deuda?</Text>
              </View>
              <Text style={styles.infoText}>
                No te presentaste a una o más sesiones confirmadas. Se aplicó una multa que superó
                tu saldo disponible, generando una deuda con la plataforma.
              </Text>

              <View style={[styles.infoRow, { marginTop: 14 }]}>
                <Ionicons name="refresh-circle-outline" size={16} color={appTheme.colors.textMuted} />
                <Text style={styles.infoTitle}>¿Cómo se cancela automáticamente?</Text>
              </View>
              <Text style={styles.infoText}>
                Si no pagas ahora, la deuda se descuenta de tus próximas ganancias. Cuando quede
                saldada, tu perfil vuelve a ser visible automáticamente.
              </Text>
            </View>
          </>
        )}

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>

      <PayDebtQrModal
        visible={showQrModal}
        debtBob={debtBob}
        onClose={() => setShowQrModal(false)}
        onSuccess={() => {
          setShowQrModal(false);
          reload();
        }}
      />

      <PayDebtStripeModal
        visible={showStripeModal}
        debtUsd={debtUsd}
        onClose={() => setShowStripeModal(false)}
        onSuccess={() => {
          setShowStripeModal(false);
          reload();
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 24,
    gap: 16,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#DC2626",
    fontFamily: appTheme.fonts.heading,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  debtCards: {
    flexDirection: "row",
    gap: 12,
    alignSelf: "stretch",
    marginTop: 4,
  },
  debtCard: {
    flex: 1,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  debtLabel: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "600",
  },
  debtAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#DC2626",
    fontFamily: appTheme.fonts.heading,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#3E7F61",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  payBtnStripe: {
    backgroundColor: "#1E4D7B",
  },
  payBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  infoCard: {
    alignSelf: "stretch",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: appTheme.colors.textMuted,
  },
  infoText: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    lineHeight: 19,
  },
  backBtn: {
    alignSelf: "stretch",
    backgroundColor: appTheme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  penaltiesSection: {
    alignSelf: "stretch",
    gap: 10,
  },
  penaltiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  penaltiesTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  penaltiesTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  verMasLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
    textDecorationLine: "underline",
  },
  verMasBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF7F7",
  },
  verMasBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
});
