import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { getAdminReferrals, type AdminReferralRecord } from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminKpiCard from "../components/AdminKpiCard";

export default function AdminReferralsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminReferralRecord[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, qualified: 0, rewarded: 0, totalRewardCredits: 0 });

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const referrals = await getAdminReferrals({ limit: 100 });
        setRows(referrals.data);
        setSummary(referrals.summary);
      } catch {
        setError("No se pudo cargar datos de referidos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    return {
      total: Number(summary.total ?? 0),
      pending: Number(summary.pending ?? 0),
      qualified: Number(summary.qualified ?? 0),
      rewarded: Number(summary.rewarded ?? 0),
      rewards: Number(summary.totalRewardCredits ?? 0),
    };
  }, [summary]);

  return (
    <View style={styles.page}>
      {loading ? <Text style={styles.info}>Cargando referidos...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.kpiGrid}>
        <AdminKpiCard label="Referidos totales" value={String(metrics.total)} />
        <AdminKpiCard label="Pendientes" value={String(metrics.pending)} tone="warning" />
        <AdminKpiCard label="Calificados" value={String(metrics.qualified)} tone="neutral" />
        <AdminKpiCard label="Recompensados" value={String(metrics.rewarded)} tone="positive" />
        <AdminKpiCard label="Créditos entregados" value={`${metrics.rewards.toFixed(2)} cr`} />
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Programa de referidos</Text>
        <Text style={styles.cardLine}>Estados: pendiente, calificado por depósito y recompensado.</Text>
        <Text style={styles.cardLine}>Las recompensas se registran como créditos promocionales no contables.</Text>
      </AppCard>

      {rows.length === 0 ? (
        <AdminEmptyState title="Sin referidos" description="Aún no hay actividad del programa de referidos." />
      ) : (
        <AdminDataTable
          rows={rows}
          columns={[
            { key: "code", title: "Código", width: 140, render: (row) => <Text style={styles.cellPrimary}>{row.codeUsed}</Text> },
            {
              key: "referred",
              title: "Usuario referido",
              width: 220,
              render: (row) => <Text style={styles.cellPrimary}>{row.referred.fullName || row.referred.email || "Usuario"}</Text>,
            },
            {
              key: "referrer",
              title: "Referrer",
              width: 220,
              render: (row) => <Text style={styles.cellMuted}>{row.referrer.fullName || row.referrer.email || "Usuario"}</Text>,
            },
            {
              key: "status",
              title: "Estado",
              width: 140,
              render: (row) => (
                <Text
                  style={[
                    styles.status,
                    row.status === "REWARDED"
                      ? styles.ok
                      : row.status === "QUALIFIED"
                        ? styles.qualified
                        : styles.pending,
                  ]}
                >
                  {row.status}
                </Text>
              ),
            },
            {
              key: "reward",
              title: "Recompensa",
              width: 120,
              render: (row) => <Text style={styles.cellPrimary}>{Number(row.rewardCredits).toFixed(2)} cr</Text>,
            },
            {
              key: "date",
              title: "Fecha",
              width: 140,
              render: (row) => <Text style={styles.cellMuted}>{new Date(row.createdAt).toLocaleDateString()}</Text>,
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
  qualified: {
    color: "#2563EB",
  },
  pending: {
    color: "#B45309",
  },
});
