import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { getAdminStats, getPromotionalCreditGrants } from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminKpiCard from "../components/AdminKpiCard";

const fallbackReferrals = [
  { id: "r1", code: "SALUD-AB12", referredUser: "Usuario demo", status: "PENDING", reward: 10, createdAt: new Date().toISOString() },
  { id: "r2", code: "SALUD-CD34", referredUser: "Usuario demo 2", status: "COMPLETED", reward: 15, createdAt: new Date().toISOString() },
];

export default function AdminReferralsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [rows, setRows] = useState<any[]>(fallbackReferrals);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, grants] = await Promise.all([getAdminStats(), getPromotionalCreditGrants(100)]);
        setStats(statsData);

        const inferred = grants
          .filter((item: any) => (item.reason ?? "").toLowerCase().includes("refer"))
          .map((item: any) => ({
            id: item.id,
            code: "N/A",
            referredUser: [item.recipient?.firstName, item.recipient?.lastName].filter(Boolean).join(" ") || item.recipient?.email || "Usuario",
            status: "COMPLETED",
            reward: Number(item.amount ?? 0),
            createdAt: item.createdAt,
          }));

        if (inferred.length > 0) {
          setRows(inferred);
        }
      } catch {
        setError("No se pudo cargar datos de referidos. Mostrando fallback MVP.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((item) => item.status === "COMPLETED").length;
    const pending = rows.filter((item) => item.status !== "COMPLETED").length;
    const rewards = rows.reduce((acc, item) => acc + Number(item.reward ?? 0), 0);
    return { total, completed, pending, rewards };
  }, [rows]);

  return (
    <View style={styles.page}>
      {loading ? <Text style={styles.info}>Cargando referidos...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.kpiGrid}>
        <AdminKpiCard label="Referidos totales" value={String(metrics.total)} />
        <AdminKpiCard label="Completados" value={String(metrics.completed)} tone="positive" />
        <AdminKpiCard label="Pendientes" value={String(metrics.pending)} tone="warning" />
        <AdminKpiCard label="Recompensas" value={`${metrics.rewards.toFixed(2)} cr`} />
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Configuracion del programa</Text>
        <Text style={styles.cardLine}>Reward base sugerido: 10 creditos</Text>
        <Text style={styles.cardLine}>Estado del programa: Activo</Text>
        <Text style={styles.cardHint}>TODO: conectar endpoint /referrals admin para reglas, tasas y trazabilidad real.</Text>
      </AppCard>

      {rows.length === 0 ? (
        <AdminEmptyState title="Sin referidos" description="Aun no hay actividad del programa de referidos." />
      ) : (
        <AdminDataTable
          rows={rows}
          columns={[
            { key: "code", title: "Codigo", width: 140, render: (row) => <Text style={styles.cellPrimary}>{row.code}</Text> },
            { key: "user", title: "Usuario referido", width: 220, render: (row) => <Text style={styles.cellPrimary}>{row.referredUser}</Text> },
            {
              key: "status",
              title: "Estado",
              width: 120,
              render: (row) => (
                <Text style={[styles.status, row.status === "COMPLETED" ? styles.ok : styles.pending]}>{row.status}</Text>
              ),
            },
            { key: "reward", title: "Recompensa", width: 120, render: (row) => <Text style={styles.cellPrimary}>{Number(row.reward).toFixed(2)} cr</Text> },
            {
              key: "date",
              title: "Fecha",
              width: 140,
              render: (row) => <Text style={styles.cellMuted}>{new Date(row.createdAt).toLocaleDateString()}</Text>,
            },
          ]}
        />
      )}

      <AppCard>
        <Text style={styles.cardTitle}>Contexto de negocio</Text>
        <Text style={styles.cardLine}>Nuevos usuarios del mes: {Number(stats?.clients?.newThisMonth ?? 0)}</Text>
        <Text style={styles.cardLine}>Clientes activos: {Number(stats?.clients?.active ?? 0)}</Text>
      </AppCard>
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
  cardTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  cardLine: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  cardHint: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
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
  status: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  ok: {
    color: appTheme.colors.success,
  },
  pending: {
    color: "#B45309",
  },
});
