import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import {
  getAdminPendingWithdrawalRequests,
  getAdminProfessionals,
  getAdminStats,
  getAdminWithdrawalHistory,
} from "../api/adminApi";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminKpiCard from "../components/AdminKpiCard";
import AdminSectionCard from "../components/AdminSectionCard";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useAdminResponsive } from "../hooks/useAdminResponsive";

function fullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || "Sin nombre";
}

function money(value: number) {
  return `Bs ${Math.round(value).toLocaleString()}`;
}

function errorMessage(error: any) {
  const raw = error?.response?.data?.message ?? error?.message;
  if (Array.isArray(raw)) return raw.join(", ");
  if (typeof raw === "string" && raw.trim().length > 0) return raw;
  return "Error desconocido";
}

export default function AdminOverviewScreen() {
  const { isMobile, contentPadding } = useAdminResponsive();
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

        const [statsResult, professionalsResult, withdrawalsResult, withdrawalHistoryResult] = await Promise.allSettled([
          getAdminStats(),
          getAdminProfessionals(undefined, undefined, 50),
          getAdminPendingWithdrawalRequests(undefined, undefined, 8),
          getAdminWithdrawalHistory(undefined, undefined, 100),
        ]);

        const failures: string[] = [];

        if (statsResult.status === "fulfilled") {
          setStats(statsResult.value);
        } else {
          failures.push(`stats: ${errorMessage(statsResult.reason)}`);
          setStats(null);
        }

        if (professionalsResult.status === "fulfilled") {
          setPendingProfessionals(professionalsResult.value.data.filter((p: any) => !p.isActive).slice(0, 6));
        } else {
          failures.push(`professionals: ${errorMessage(professionalsResult.reason)}`);
          setPendingProfessionals([]);
        }

        if (withdrawalsResult.status === "fulfilled") {
          setPendingWithdrawals(withdrawalsResult.value.data.slice(0, 6));
        } else {
          failures.push(`withdrawals_pending: ${errorMessage(withdrawalsResult.reason)}`);
          setPendingWithdrawals([]);
        }

        if (withdrawalHistoryResult.status === "fulfilled") {
          setPaidToProfessionals(
            withdrawalHistoryResult.value.data.reduce(
              (acc: number, item: any) => acc + Number(item.amountBs ?? item.soles ?? 0),
              0,
            ),
          );
        } else {
          failures.push(`withdrawals_history: ${errorMessage(withdrawalHistoryResult.reason)}`);
          setPaidToProfessionals(0);
        }

        if (failures.length === 4) {
          setError(`No se pudo cargar el dashboard principal. ${failures.join(" | ")}`);
        } else if (failures.length > 0) {
          setError(`Dashboard cargado parcialmente. Falló: ${failures.join(" | ")}`);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kpis = useMemo(() => {
    if (!stats) return [];
    const gross = Number(stats?.deposits?.totalRevenue ?? 0);
    const platform = Number(stats?.finance?.platformEarnings ?? gross * 0.45);
    const paid = Number(paidToProfessionals ?? 0);
    const newUsers = Number(stats?.clients?.newThisMonth ?? 0);
    const newProfessionals = Math.max(Number(stats?.professionals?.inactive ?? 0), 0);
    const referrals = Number(stats?.finance?.referralRewards ?? 0);

    return [
      { label: "Ingresos brutos", value: money(gross), delta: "+18% vs mes ant.", tone: "positive" as const },
      { label: "Ganancia plataforma", value: money(platform), delta: "45% del bruto", tone: "neutral" as const },
      { label: "Pagado a profesionales", value: money(paid), delta: "55% del bruto", tone: "positive" as const },
      { label: "Por referidos", value: money(referrals), delta: "Programa activo", tone: "warning" as const },
      { label: "Nuevos usuarios", value: String(newUsers), delta: "+12% este mes", tone: "neutral" as const },
      { label: "Nuevos profesionales", value: String(newProfessionals), delta: `${newProfessionals} pendientes`, tone: "positive" as const },
    ];
  }, [stats, paidToProfessionals]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.loading}>Cargando dashboard...</Text> : null}

      <View style={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <AdminKpiCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} tone={kpi.tone} />
        ))}
      </View>

      <View style={[styles.columns, { flexDirection: isMobile ? "column" : "row" }]}>
        <View style={styles.column}>
          <AdminSectionCard
            title="Profesionales en revisión"
            description="Cuentas pendientes de validación y habilitación administrativa."
          />
          {pendingProfessionals.length === 0 ? (
            <AdminEmptyState title="Sin pendientes" description="No hay profesionales en revisión ahora mismo." />
          ) : (
            pendingProfessionals.map((item) => (
              <AppCard key={item.id}>
                <Text style={styles.rowTitle}>{fullName(item.firstName, item.lastName)}</Text>
                <Text style={styles.rowMeta}>{item.email ?? item.phoneNumber}</Text>
                <AdminStatusBadge label={item.isActive ? "Activo" : "Revisión"} tone={item.isActive ? "positive" : "warning"} />
              </AppCard>
            ))
          )}
        </View>

        <View style={styles.column}>
          <AdminSectionCard
            title="Retiros pendientes"
            description="Solicitudes en espera de aprobación por el equipo financiero."
          />
          {pendingWithdrawals.length === 0 ? (
            <AdminEmptyState title="Sin retiros pendientes" description="No hay solicitudes en espera." />
          ) : (
            pendingWithdrawals.map((item) => (
              <AppCard key={item.id}>
                <Text style={styles.rowTitle}>{fullName(item.professional?.firstName, item.professional?.lastName)}</Text>
                <Text style={styles.rowMeta}>
                  {Number(item.credits).toFixed(2)} cr · Bs {Number(item.amountBs ?? item.soles ?? 0).toFixed(2)}
                </Text>
                <AdminStatusBadge label="Pendiente" tone="warning" />
              </AppCard>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    paddingBottom: 28,
    gap: 18,
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
    gap: 14,
  },
  columns: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  column: {
    flex: 1,
    gap: 10,
  },
  rowTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  rowMeta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
});
