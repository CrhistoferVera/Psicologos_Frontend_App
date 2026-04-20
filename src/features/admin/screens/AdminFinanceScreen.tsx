import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import {
  getAdminDeposits,
  getAdminPendingWithdrawalRequests,
  getAdminStats,
  getPromotionalCreditGrants,
  updateAdminDepositStatus,
  updateAdminWithdrawalStatus,
} from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminKpiCard from "../components/AdminKpiCard";
import AdminStatusBadge from "../components/AdminStatusBadge";

function fullName(person: { firstName?: string | null; lastName?: string | null }) {
  return [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Sin nombre";
}

export default function AdminFinanceScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [grants, setGrants] = useState<any[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [statsData, depositsData, withdrawalsData, grantsData] = await Promise.all([
        getAdminStats(),
        getAdminDeposits(undefined, undefined, 30),
        getAdminPendingWithdrawalRequests(undefined, undefined, 30),
        getPromotionalCreditGrants(100),
      ]);
      setStats(statsData);
      setDeposits(depositsData.requests);
      setWithdrawals(withdrawalsData.data);
      setGrants(grantsData);
    } catch {
      setError("No se pudo cargar el panel financiero.");
    } finally {
      setLoading(false);
    }
  }

  const financial = useMemo(() => {
    const gross = Number(stats?.deposits?.totalRevenue ?? 0);
    const platform = gross;
    const professionalPaid = withdrawals.reduce((acc, item) => acc + Number(item.soles ?? 0), 0);
    const promotional = grants.reduce((acc, item) => acc + Number(item.amount ?? 0), 0);
    const referrals = 0;
    return { gross, platform, professionalPaid, promotional, referrals };
  }, [stats, withdrawals, grants]);

  async function handleDepositStatus(id: string, status: "APPROVED" | "REJECTED") {
    try {
      await updateAdminDepositStatus(id, status, status === "REJECTED" ? "Rechazado desde panel admin" : undefined);
      await loadData();
      Alert.alert("Deposito actualizado", `Estado cambiado a ${status}.`);
    } catch (err: any) {
      Alert.alert("No se pudo actualizar", err?.message ?? "Intenta nuevamente.");
    }
  }

  async function handleRejectWithdrawal(id: string) {
    try {
      await updateAdminWithdrawalStatus(id, { status: "REJECTED", rejectionReason: "Rechazado desde panel admin" });
      await loadData();
      Alert.alert("Retiro actualizado", "Solicitud rechazada.");
    } catch (err: any) {
      Alert.alert("No se pudo actualizar", err?.message ?? "Intenta nuevamente.");
    }
  }

  return (
    <View style={styles.page}>
      {loading ? <Text style={styles.info}>Cargando datos financieros...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.kpiGrid}>
        <AdminKpiCard label="Bruto" value={`${financial.gross.toFixed(2)} cr`} tone="positive" />
        <AdminKpiCard label="Plataforma" value={`${financial.platform.toFixed(2)} cr`} tone="positive" />
        <AdminKpiCard label="Pagado a professionals" value={`Bs ${financial.professionalPaid.toFixed(2)}`} />
        <AdminKpiCard label="Promocional" value={`${financial.promotional.toFixed(2)} cr`} tone="warning" />
        <AdminKpiCard label="Referidos" value={`${financial.referrals}`} />
      </View>

      <AppCard>
        <Text style={styles.noteTitle}>Resumen financiero</Text>
        <Text style={styles.noteText}>Bruto y plataforma usan metrica contable disponible en `admin/stats`.</Text>
        <Text style={styles.noteText}>Promocional se calcula desde grants y no debe contaminar revenue real.</Text>
        <Text style={styles.noteText}>TODO: conectar ledger consolidado para split exacto bruto/plataforma/professional.</Text>
      </AppCard>

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
              title: "Monto",
              width: 120,
              render: (row) => <Text style={styles.cellPrimary}>Bs {Number(row.amountBs ?? 0).toFixed(2)}</Text>,
            },
            {
              key: "credits",
              title: "Creditos",
              width: 120,
              render: (row) => <Text style={styles.cellPrimary}>{Number(row.creditsToDeliver ?? 0).toFixed(2)}</Text>,
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
              title: "Professional",
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
              key: "soles",
              title: "Equiv. Bolivianos",
              width: 120,
              render: (row) => <Text style={styles.cellMuted}>Bs {Number(row.soles).toFixed(2)}</Text>,
            },
            {
              key: "account",
              title: "Cuenta",
              width: 210,
              render: (row) => <Text style={styles.cellMuted}>{row.bankName} · {row.accountNumber}</Text>,
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
                    style={[styles.approveBtn, { opacity: 0.6 }]}
                    onPress={() => Alert.alert("Pendiente", "Aprobacion requiere comprobante (TODO: subir receipt en flujo web).")}
                  >
                    <Text style={styles.approveText}>Aprobar</Text>
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => void handleRejectWithdrawal(row.id)}>
                    <Text style={styles.rejectText}>Rechazar</Text>
                  </Pressable>
                </View>
              ),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
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
  actionsCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
});
