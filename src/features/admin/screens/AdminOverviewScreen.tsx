import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { getAdminPendingWithdrawalRequests, getAdminProfessionals, getAdminStats, getAdminWithdrawalHistory } from "../api/adminApi";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminKpiCard from "../components/AdminKpiCard";
import AdminSectionCard from "../components/AdminSectionCard";
import AdminStatusBadge from "../components/AdminStatusBadge";

function fullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || "Sin nombre";
}

export default function AdminOverviewScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [pendingProfessionals, setPendingProfessionals] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [paidToProfessionals, setPaidToProfessionals] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, professionalsData, withdrawalsData, withdrawalHistory] = await Promise.all([
          getAdminStats(),
          getAdminProfessionals(undefined, undefined, 50),
          getAdminPendingWithdrawalRequests(undefined, undefined, 8),
          getAdminWithdrawalHistory(undefined, undefined, 100),
        ]);

        setStats(statsData);
        setPendingProfessionals(
          professionalsData.data.filter((p: any) => !p.isActive).slice(0, 6),
        );
        setPendingWithdrawals(withdrawalsData.data.slice(0, 6));
        setPaidToProfessionals(
          withdrawalHistory.data.reduce((acc: number, item: any) => acc + Number(item.soles ?? 0), 0),
        );
      } catch {
        setError("No se pudo cargar el overview admin.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kpis = useMemo(() => {
    if (!stats) return [];
    const gross = Number(stats?.deposits?.totalRevenue ?? 0);
    const platform = gross;
    const paid = Number(paidToProfessionals ?? 0);
    const newUsers = Number(stats?.clients?.newThisMonth ?? 0);
    const newProfessionals = Math.max(Number(stats?.professionals?.inactive ?? 0), 0);
    const referrals = 0;

    return [
      { label: "Ingresos brutos", value: `${gross.toFixed(2)} cr`, tone: "positive" as const },
      { label: "Ganancia plataforma", value: `${platform.toFixed(2)} cr`, tone: "positive" as const },
      { label: "Pagado a professionals", value: `S/ ${paid.toFixed(2)}`, tone: "neutral" as const },
      { label: "Referidos", value: String(referrals), tone: "neutral" as const },
      { label: "Nuevos usuarios", value: String(newUsers), tone: "neutral" as const },
      { label: "Nuevos professionals", value: String(newProfessionals), tone: "warning" as const },
    ];
  }, [stats, paidToProfessionals]);

  return (
    <View style={styles.page}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.loading}>Cargando overview...</Text> : null}

      <View style={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <AdminKpiCard key={kpi.label} label={kpi.label} value={kpi.value} tone={kpi.tone} />
        ))}
      </View>

      <View style={styles.columns}>
        <View style={styles.column}>
          <AdminSectionCard
            title="Pendientes: professionals en revision"
            description="Cuentas sin activar, pendientes de validacion administrativa."
          />
          {pendingProfessionals.length === 0 ? (
            <AdminEmptyState title="Sin pendientes" description="No hay professionals en revision ahora mismo." />
          ) : (
            <FlatList
              data={pendingProfessionals}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <AppCard>
                  <Text style={styles.rowTitle}>{fullName(item.firstName, item.lastName)}</Text>
                  <Text style={styles.rowMeta}>{item.email ?? item.phoneNumber}</Text>
                  <AdminStatusBadge label={item.isActive ? "Activo" : "Revision"} tone={item.isActive ? "positive" : "warning"} />
                </AppCard>
              )}
            />
          )}
        </View>

        <View style={styles.column}>
          <AdminSectionCard
            title="Pendientes: retiros"
            description="Solicitudes de retiro pendientes de aprobacion por el equipo financiero."
          />
          {pendingWithdrawals.length === 0 ? (
            <AdminEmptyState title="Sin retiros pendientes" description="No hay solicitudes de retiro en espera." />
          ) : (
            <FlatList
              data={pendingWithdrawals}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <AppCard>
                  <Text style={styles.rowTitle}>{fullName(item.professional?.firstName, item.professional?.lastName)}</Text>
                  <Text style={styles.rowMeta}>{Number(item.credits).toFixed(2)} cr · S/ {Number(item.soles).toFixed(2)}</Text>
                  <AdminStatusBadge label="Pendiente" tone="warning" />
                </AppCard>
              )}
            />
          )}
        </View>
      </View>

      <AppCard>
        <Text style={styles.alertTitle}>Alertas del sistema</Text>
        <Text style={styles.alertItem}>Depositos pendientes: {Number(stats?.deposits?.pending ?? 0)}</Text>
        <Text style={styles.alertItem}>Retiros pendientes: {Number(stats?.withdrawals?.pending ?? 0)}</Text>
        <Text style={styles.alertItem}>Mensajes totales (actividad): {Number(stats?.activity?.messages ?? 0)}</Text>
        <Text style={styles.alertHint}>TODO: incluir alertas de fraude y desviaciones de margen cuando exista ledger detallado.</Text>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    gap: 14,
  },
  loading: {
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
  columns: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  column: {
    flex: 1,
    gap: 10,
  },
  rowTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  rowMeta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  alertTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  alertItem: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  alertHint: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
});
