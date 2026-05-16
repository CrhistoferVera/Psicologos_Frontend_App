import { Clipboard, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import { formatBob, formatUsd } from "../../../utils/money";
import type { WithdrawalRequest } from "../../../api/wallet";
import { statusMeta } from "./WithdrawalHistoryCard";

function formatDateTime(iso?: string) {
  if (!iso) return "Sin fecha";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleString("es-BO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function gradientColors(status: WithdrawalRequest["status"]): [string, string, string] {
  if (status === "APPROVED") return ["#15803D", "#16A34A", "#22C55E"];
  if (status === "REJECTED") return ["#B91C1C", "#DC2626", "#EF4444"];
  return ["#B45309", "#D97706", "#F59E0B"];
}

function sheetBg(status: WithdrawalRequest["status"]) {
  if (status === "APPROVED") return "#F0FDF4";
  if (status === "REJECTED") return "#FFF5F5";
  return "#FFFBEB";
}

function shadowColor(status: WithdrawalRequest["status"]) {
  if (status === "APPROVED") return "#16A34A";
  if (status === "REJECTED") return "#DC2626";
  return "#D97706";
}

interface Props {
  withdrawal: WithdrawalRequest | null;
  onClose: () => void;
}

export default function WithdrawalDetailModal({ withdrawal, onClose }: Props) {
  if (!withdrawal) return null;

  const status = statusMeta(withdrawal.status);
  const gradient = gradientColors(withdrawal.status);
  const currency = (withdrawal.currency ?? "BOB") as "BOB" | "USD";
  const rawAmount = Number(withdrawal.amountBs ?? withdrawal.soles ?? 0);
  const amount = currency === "USD" ? formatUsd(rawAmount) : formatBob(rawAmount);
  const isCrypto = withdrawal.method === "CRYPTO";

  return (
    <Modal visible={!!withdrawal} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.center}>
        <View style={[styles.sheet, { shadowColor: shadowColor(withdrawal.status) }]}>
          {/* Header */}
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.headerContent}>
              <View style={styles.iconWrap}>
                <Ionicons name={isCrypto ? "logo-bitcoin" : "card-outline"} size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Solicitud de Retiro</Text>
                <Text style={styles.headerSub}>
                  {isCrypto ? "Transferencia cripto" : "Transferencia bancaria"}
                </Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.85)" />
              </Pressable>
            </View>
          </LinearGradient>

          {/* Body */}
          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
          {/* Amount hero */}
          <View style={styles.amountBlock}>
            <Text style={styles.amountLabel}>Monto solicitado</Text>
            <Text style={styles.amountValue}>{amount}</Text>
            <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: status.border }]} />
              <Text style={[styles.statusLabel, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Method section */}
          <Text style={styles.sectionTitle}>Método de pago</Text>
          {isCrypto ? (
            <>
              <DetailRow icon="logo-bitcoin" label="Moneda" value={withdrawal.cryptoCurrency ?? "USDT"} />
              <DetailRow icon="git-network-outline" label="Red" value={withdrawal.cryptoNetwork ?? "BEP20"} />
              {withdrawal.cryptoAddress ? (
                <DetailRow icon="wallet-outline" label="Dirección" value={withdrawal.cryptoAddress} mono />
              ) : null}
            </>
          ) : (
            <>
              {withdrawal.bankName ? (
                <DetailRow icon="business-outline" label="Banco" value={withdrawal.bankName} />
              ) : null}
              {withdrawal.accountNumber ? (
                <DetailRow icon="card-outline" label="Número de cuenta" value={withdrawal.accountNumber} mono />
              ) : null}
              {withdrawal.accountHolderName ? (
                <DetailRow icon="person-outline" label="Titular" value={withdrawal.accountHolderName} />
              ) : null}
            </>
          )}

          <View style={styles.divider} />

          {/* Dates section */}
          <Text style={styles.sectionTitle}>Fechas</Text>
          <DetailRow icon="time-outline" label="Solicitado" value={formatDateTime(withdrawal.createdAt)} />
          {withdrawal.updatedAt && withdrawal.updatedAt !== withdrawal.createdAt ? (
            <DetailRow icon="refresh-outline" label="Actualizado" value={formatDateTime(withdrawal.updatedAt)} />
          ) : null}

          {/* Rejection reason */}
          {withdrawal.rejectionReason ? (
            <>
              <View style={styles.divider} />
              <View style={styles.rejectionBlock}>
                <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectionTitle}>Motivo de rechazo</Text>
                  <Text style={styles.rejectionText}>{withdrawal.rejectionReason}</Text>
                </View>
              </View>
            </>
          ) : null}

          {/* TxID */}
          {withdrawal.txId ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Comprobante Binance</Text>
              <View style={styles.txIdRow}>
                <Text style={styles.txIdText} numberOfLines={2}>{withdrawal.txId}</Text>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => Clipboard.setString(withdrawal.txId!)}
                >
                  <Ionicons name="copy-outline" size={14} color="#FFF" />
                  <Text style={styles.copyBtnText}>Copiar</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {/* Receipt */}
          {withdrawal.receiptUrl ? (
            <Pressable
              style={styles.receiptBtn}
              onPress={() => void Linking.openURL(withdrawal.receiptUrl!)}
            >
              <Ionicons name="document-text-outline" size={16} color="#FFF" />
              <Text style={styles.receiptBtnText}>Ver comprobante</Text>
            </Pressable>
          ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({
  icon, label, value, mono,
}: {
  icon: string; label: string; value: string; mono?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={14} color={appTheme.colors.textMuted} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.detailMono]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  sheet: {
    width: "100%",
    borderRadius: 24,
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
    overflow: "hidden",
  },
  header: {
    overflow: "hidden",
    paddingBottom: 18,
    paddingTop: 16,
  },
  circle1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -70,
    right: -50,
  },
  circle2: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -35,
    left: -25,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerTitle: {
    color: "#FFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
  },
  headerSub: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  body: {
    padding: 20,
    gap: 10,
    paddingBottom: 28,
  },
  amountBlock: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  amountLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  amountValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: appTheme.fonts.body,
  },
  divider: {
    height: 1,
    backgroundColor: appTheme.colors.border,
    opacity: 0.5,
    marginVertical: 4,
  },
  sectionTitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.heading,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    width: 110,
  },
  detailValue: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  detailMono: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  rejectionBlock: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
  },
  rejectionTitle: {
    color: "#991B1B",
    fontFamily: appTheme.fonts.heading,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  rejectionText: {
    color: "#B91C1C",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  txIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 10,
  },
  txIdText: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: 12,
    color: appTheme.colors.text,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: appTheme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyBtnText: {
    color: "#FFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "600",
  },
  receiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: appTheme.colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 8,
  },
  receiptBtnText: {
    color: "#FFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },
});
