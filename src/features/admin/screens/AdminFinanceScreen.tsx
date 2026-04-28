import { useEffect, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";
import {
  getAdminDeposits,
  getAdminPendingWithdrawalRequests,
  getAdminStats,
  getAdminWithdrawalHistory,
  getPromotionalCreditGrants,
  updateAdminDepositStatus,
  updateAdminWithdrawalStatus,
} from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminKpiCard from "../components/AdminKpiCard";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminResponsive } from "../hooks/useAdminResponsive";

function fullName(person: { firstName?: string | null; lastName?: string | null }) {
  return [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Sin nombre";
}

function moneyBs(value: number) {
  return `Bs ${Number(value || 0).toFixed(2)}`;
}

export default function AdminFinanceScreen() {
  const { contentPadding } = useAdminResponsive();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [, setGrants] = useState<any[]>([]);

  const [approvalTarget, setApprovalTarget] = useState<any | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalReceipt, setApprovalReceipt] = useState<
    | { uri?: string; file?: File; name?: string; type?: string }
    | null
  >(null);
  const [approving, setApproving] = useState(false);

  const [rejectionTarget, setRejectionTarget] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [statsData, depositsData, withdrawalsData, withdrawalHistoryData, grantsData] = await Promise.all([
        getAdminStats(),
        getAdminDeposits(undefined, undefined, 30),
        getAdminPendingWithdrawalRequests(undefined, undefined, 30),
        getAdminWithdrawalHistory(undefined, undefined, 30),
        getPromotionalCreditGrants(100),
      ]);
      setStats(statsData);
      setDeposits(depositsData.requests);
      setWithdrawals(withdrawalsData.data);
      setWithdrawalHistory(withdrawalHistoryData.data);
      setGrants(grantsData);
    } catch {
      setError("No se pudo cargar el panel financiero.");
    } finally {
      setLoading(false);
    }
  }

  const financial = useMemo(() => {
    const gross = Number(stats?.finance?.grossRealRevenue ?? stats?.deposits?.totalRevenue ?? 0);
    const platform = Number(stats?.finance?.platformEarnings ?? 0);
    const professionalPaid = Number(stats?.finance?.professionalPaid ?? 0);
    const promotional = Number(stats?.finance?.promotionalGranted ?? 0);
    const referrals = Number(stats?.finance?.referralRewards ?? 0);
    const withdrawalsPending = Number(stats?.withdrawals?.pending ?? withdrawals.length);
    return { gross, platform, professionalPaid, promotional, referrals, withdrawalsPending };
  }, [stats, withdrawals.length]);

  async function handleDepositStatus(id: string, status: "APPROVED" | "REJECTED") {
    try {
      await updateAdminDepositStatus(id, status, status === "REJECTED" ? "Rechazado desde panel admin" : undefined);
      await loadData();
      Alert.alert("Deposito actualizado", `Estado cambiado a ${status}.`);
    } catch (err: any) {
      Alert.alert("No se pudo actualizar", err?.message ?? "Intenta nuevamente.");
    }
  }

  async function pickReceipt() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0] as any;
      setApprovalReceipt({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? "application/octet-stream",
        file: asset.file,
      });
    } catch {
      Alert.alert("No se pudo seleccionar el comprobante.");
    }
  }

  async function handleApproveWithdrawal() {
    if (!approvalTarget) return;
    if (!approvalReceipt) {
      Alert.alert("Comprobante requerido", "Debes adjuntar un comprobante para aprobar el retiro.");
      return;
    }

    try {
      setApproving(true);
      await updateAdminWithdrawalStatus(approvalTarget.id, {
        status: "APPROVED",
        notes: approvalNotes.trim() || undefined,
        receipt: {
          uri: approvalReceipt.uri,
          file: approvalReceipt.file,
          name: approvalReceipt.name,
          type: approvalReceipt.type,
        },
      });
      setApprovalTarget(null);
      setApprovalReceipt(null);
      setApprovalNotes("");
      await loadData();
      Alert.alert("Retiro aprobado", "El retiro se aprobo con comprobante.");
    } catch (err: any) {
      Alert.alert("No se pudo aprobar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setApproving(false);
    }
  }

  async function handleRejectWithdrawal() {
    if (!rejectionTarget) return;
    if (!rejectionReason.trim()) {
      Alert.alert("Motivo requerido", "Debes ingresar un motivo para rechazar el retiro.");
      return;
    }

    try {
      setRejecting(true);
      await updateAdminWithdrawalStatus(rejectionTarget.id, {
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
        notes: rejectionNotes.trim() || undefined,
      });
      setRejectionTarget(null);
      setRejectionReason("");
      setRejectionNotes("");
      await loadData();
      Alert.alert("Retiro actualizado", "Solicitud rechazada.");
    } catch (err: any) {
      Alert.alert("No se pudo actualizar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setRejecting(false);
    }
  }

  function openUrl(url?: string | null) {
    if (!url) return;
    void Linking.openURL(url);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}>
      {loading ? <Text style={styles.info}>Cargando datos financieros...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.kpiGrid}>
        <AdminKpiCard label="Ingresos brutos" value={moneyBs(financial.gross)} tone="positive" />
        <AdminKpiCard label="Ganancia plataforma" value={moneyBs(financial.platform)} tone="positive" />
        <AdminKpiCard label="Pagado a profesionales" value={moneyBs(financial.professionalPaid)} />
        <AdminKpiCard label="Promocional otorgado" value={moneyBs(financial.promotional)} tone="warning" />
        <AdminKpiCard label="Rewards referidos" value={moneyBs(financial.referrals)} tone="warning" />
        <AdminKpiCard label="Retiros pendientes" value={String(financial.withdrawalsPending)} tone="neutral" />
      </View>

      <Text style={styles.sectionTitle}>Depositos recientes</Text>
      {deposits.length === 0 ? (
        <AdminEmptyState title="Sin depositos" description="No hay solicitudes de deposito recientes." />
      ) : (
        <AdminDataTable
          rows={deposits}
          columns={[
            {
              key: "user",
              title: "Usuario",
              width: 190,
              render: (row) => <Text style={styles.cellPrimary}>{fullName(row.user)}</Text>,
            },
            {
              key: "package",
              title: "Paquete",
              width: 170,
              render: (row) => <Text style={styles.cellMuted}>{row.packageNameAtMoment ?? "-"}</Text>,
            },
            {
              key: "amount",
              title: "Monto Bs",
              width: 120,
              render: (row) => <Text style={styles.cellPrimary}>{moneyBs(Number(row.amountBs ?? row.amount ?? 0))}</Text>,
            },
            {
              key: "credits",
              title: "Creditos",
              width: 120,
              render: (row) => <Text style={styles.cellPrimary}>{Number(row.creditsToDeliver ?? 0).toFixed(2)}</Text>,
            },
            {
              key: "receipt",
              title: "Comprobante",
              width: 130,
              render: (row) =>
                row.receiptUrl ? (
                  <Pressable onPress={() => openUrl(row.receiptUrl)}>
                    <Text style={styles.linkText}>Ver</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.cellMuted}>-</Text>
                ),
            },
            {
              key: "status",
              title: "Estado",
              width: 120,
              render: (row) => (
                <AdminStatusBadge
                  label={row.status}
                  tone={row.status === "APPROVED" ? "positive" : row.status === "REJECTED" ? "danger" : "warning"}
                />
              ),
            },
            {
              key: "actions",
              title: "Acciones",
              width: 190,
              render: (row) => (
                <View style={styles.actionsCell}>
                  <Pressable style={styles.approveBtn} onPress={() => void handleDepositStatus(row.id, "APPROVED")}>
                    <Text style={styles.approveText}>Aprobar</Text>
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => void handleDepositStatus(row.id, "REJECTED")}>
                    <Text style={styles.rejectText}>Rechazar</Text>
                  </Pressable>
                </View>
              ),
            },
          ]}
        />
      )}

      <Text style={styles.sectionTitle}>Retiros pendientes</Text>
      {withdrawals.length === 0 ? (
        <AdminEmptyState title="Sin retiros pendientes" description="No hay solicitudes pendientes por procesar." />
      ) : (
        <AdminDataTable
          rows={withdrawals}
          columns={[
            {
              key: "professional",
              title: "Profesional",
              width: 200,
              render: (row) => <Text style={styles.cellPrimary}>{fullName(row.professional)}</Text>,
            },
            {
              key: "amount",
              title: "Retiro",
              width: 140,
              render: (row) => <Text style={styles.cellPrimary}>{Number(row.credits).toFixed(2)} cr</Text>,
            },
            {
              key: "bs",
              title: "Equiv. Bs",
              width: 120,
              render: (row) => <Text style={styles.cellMuted}>{moneyBs(Number(row.amountBs ?? row.soles ?? 0))}</Text>,
            },
            {
              key: "account",
              title: "Cuenta",
              width: 260,
              render: (row) => (
                <Text style={styles.cellMuted}>
                  {row.bankName} - {row.accountNumber}
                  {row.accountHolderName ? ` (${row.accountHolderName})` : ""}
                </Text>
              ),
            },
            {
              key: "created",
              title: "Fecha",
              width: 140,
              render: (row) => <Text style={styles.cellMuted}>{new Date(row.createdAt).toLocaleDateString()}</Text>,
            },
            {
              key: "status",
              title: "Estado",
              width: 120,
              render: () => <AdminStatusBadge label="PENDING" tone="warning" />,
            },
            {
              key: "actions",
              title: "Acciones",
              width: 250,
              render: (row) => (
                <View style={styles.actionsCell}>
                  <Pressable
                    style={styles.approveBtn}
                    onPress={() => {
                      setApprovalTarget(row);
                      setApprovalNotes("");
                      setApprovalReceipt(null);
                    }}
                  >
                    <Text style={styles.approveText}>Aprobar + comprobante</Text>
                  </Pressable>
                  <Pressable
                    style={styles.rejectBtn}
                    onPress={() => {
                      setRejectionTarget(row);
                      setRejectionReason("");
                      setRejectionNotes("");
                    }}
                  >
                    <Text style={styles.rejectText}>Rechazar</Text>
                  </Pressable>
                </View>
              ),
            },
          ]}
        />
      )}

      <Text style={styles.sectionTitle}>Historial de retiros</Text>
      {withdrawalHistory.length === 0 ? (
        <AdminEmptyState title="Sin historial" description="Aun no hay retiros procesados." />
      ) : (
        <AdminDataTable
          rows={withdrawalHistory}
          columns={[
            {
              key: "professional",
              title: "Profesional",
              width: 200,
              render: (row) => <Text style={styles.cellPrimary}>{fullName(row.professional)}</Text>,
            },
            {
              key: "credits",
              title: "Creditos",
              width: 120,
              render: (row) => <Text style={styles.cellMuted}>{Number(row.credits).toFixed(2)}</Text>,
            },
            {
              key: "bs",
              title: "Bs",
              width: 130,
              render: (row) => <Text style={styles.cellMuted}>{moneyBs(Number(row.amountBs ?? row.soles ?? 0))}</Text>,
            },
            {
              key: "status",
              title: "Estado",
              width: 120,
              render: (row) => (
                <AdminStatusBadge
                  label={row.status}
                  tone={row.status === "APPROVED" ? "positive" : row.status === "REJECTED" ? "danger" : "warning"}
                />
              ),
            },
            {
              key: "reason",
              title: "Motivo rechazo",
              width: 240,
              render: (row) => <Text style={styles.cellMuted}>{row.rejectionReason ?? "-"}</Text>,
            },
            {
              key: "receipt",
              title: "Comprobante",
              width: 130,
              render: (row) =>
                row.receiptUrl ? (
                  <Pressable onPress={() => openUrl(row.receiptUrl)}>
                    <Text style={styles.linkText}>Ver</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.cellMuted}>-</Text>
                ),
            },
            {
              key: "updated",
              title: "Actualizado",
              width: 160,
              render: (row) => <Text style={styles.cellMuted}>{new Date(row.updatedAt ?? row.createdAt).toLocaleString()}</Text>,
            },
          ]}
        />
      )}

      <Modal visible={approvalTarget !== null} transparent animationType="fade" onRequestClose={() => setApprovalTarget(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setApprovalTarget(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.noteTitle}>Aprobar retiro</Text>
            <Text style={styles.cellMuted}>
              {approvalTarget ? `${fullName(approvalTarget.professional)} - ${moneyBs(Number(approvalTarget.amountBs ?? approvalTarget.soles ?? 0))}` : ""}
            </Text>
            <TextInput
              value={approvalNotes}
              onChangeText={setApprovalNotes}
              style={styles.input}
              placeholder="Nota interna (opcional)"
              placeholderTextColor={appTheme.colors.textMuted}
              multiline
            />
            <Pressable style={styles.secondaryBtn} onPress={() => void pickReceipt()}>
              <Text style={styles.secondaryBtnText}>{approvalReceipt?.name ?? "Adjuntar comprobante"}</Text>
            </Pressable>
            <View style={styles.actionsCell}>
              <Pressable style={styles.rejectBtn} onPress={() => setApprovalTarget(null)}>
                <Text style={styles.rejectText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.approveBtn} onPress={() => void handleApproveWithdrawal()} disabled={approving}>
                <Text style={styles.approveText}>{approving ? "Aprobando..." : "Confirmar aprobacion"}</Text>
              </Pressable>
            </View>
            {Platform.OS === "web" ? <Text style={styles.noteText}>Acepta imagen o PDF como comprobante.</Text> : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={rejectionTarget !== null} transparent animationType="fade" onRequestClose={() => setRejectionTarget(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRejectionTarget(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.noteTitle}>Rechazar retiro</Text>
            <Text style={styles.cellMuted}>
              {rejectionTarget ? `${fullName(rejectionTarget.professional)} - ${moneyBs(Number(rejectionTarget.amountBs ?? rejectionTarget.soles ?? 0))}` : ""}
            </Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              style={styles.input}
              placeholder="Motivo de rechazo (obligatorio)"
              placeholderTextColor={appTheme.colors.textMuted}
              multiline
            />
            <TextInput
              value={rejectionNotes}
              onChangeText={setRejectionNotes}
              style={styles.input}
              placeholder="Nota interna (opcional)"
              placeholderTextColor={appTheme.colors.textMuted}
              multiline
            />
            <View style={styles.actionsCell}>
              <Pressable style={styles.secondaryBtn} onPress={() => setRejectionTarget(null)}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.rejectBtn} onPress={() => void handleRejectWithdrawal()} disabled={rejecting}>
                <Text style={styles.rejectText}>{rejecting ? "Rechazando..." : "Confirmar rechazo"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    paddingVertical: 24,
    gap: 12,
  },
  info: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  noteTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 16,
  },
  noteText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 17,
    marginTop: 4,
  },
  cellPrimary: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  cellMuted: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  linkText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  actionsCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  approveBtn: {
    borderRadius: 8,
    backgroundColor: "rgba(107, 175, 138, 0.16)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  approveText: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  rejectBtn: {
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  rejectText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 10,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.background,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
