import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import {
  getAdminReferrals,
  getAdminBonusTiers,
  upsertAdminBonusTier,
  deleteAdminBonusTier,
  type AdminReferralRecord,
  type BonusTier,
} from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminKpiCard from "../components/AdminKpiCard";

export default function AdminReferralsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminReferralRecord[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, active: 0, qualified: 0, rewarded: 0, totalRewardCredits: 0 });

  const [tiers, setTiers] = useState<BonusTier[]>([]);
  const [tierLabel, setTierLabel] = useState("");
  const [tierMin, setTierMin] = useState("5");
  const [tierBonus, setTierBonus] = useState("0.5");
  const [tierActive, setTierActive] = useState(true);
  const [savingTier, setSavingTier] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [referrals, bonusTiers] = await Promise.all([
        getAdminReferrals({ limit: 100 }),
        getAdminBonusTiers(),
      ]);
      setRows(referrals.data);
      setSummary(referrals.summary);
      setTiers(bonusTiers);
    } catch {
      setError("No se pudo cargar datos de referidos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleAddTier() {
    const min = Number(tierMin);
    const bonus = Number(tierBonus);
    if (!tierLabel.trim()) { Alert.alert("Nombre requerido"); return; }
    if (!Number.isFinite(min) || min < 1) { Alert.alert("Mínimo de referidos inválido"); return; }
    if (!Number.isFinite(bonus) || bonus < 0) { Alert.alert("Bonus inválido"); return; }
    try {
      setSavingTier(true);
      await upsertAdminBonusTier({ label: tierLabel.trim(), minActiveReferrals: min, bonusPercent: bonus, isActive: tierActive });
      setTierLabel("");
      setTierMin("5");
      setTierBonus("0.5");
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo guardar el tier.");
    } finally {
      setSavingTier(false);
    }
  }

  async function handleDeleteTier(id: string) {
    try {
      await deleteAdminBonusTier(id);
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo eliminar el tier.");
    }
  }

  const metrics = useMemo(() => {
    return {
      total: Number(summary.total ?? 0),
      pending: Number(summary.pending ?? 0),
      active: Number((summary as any).active ?? 0),
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
        <AdminKpiCard label="Activos" value={String(metrics.active)} tone="neutral" />
        <AdminKpiCard label="Calificados (legado)" value={String(metrics.qualified)} tone="neutral" />
        <AdminKpiCard label="Créditos pagados" value={`${metrics.rewards.toFixed(2)} cr`} tone="positive" />
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Programa de referidos</Text>
        <Text style={styles.cardLine}>Recompensa: % configurable sobre ganancias reales del profesional referido.</Text>
        <Text style={styles.cardLine}>Cada transacción elegible genera un evento de reward auditado individualmente.</Text>
        <Text style={styles.cardLine}>Créditos promocionales y regalos admin NO generan recompensas.</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Tiers de bono por volumen</Text>
        <Text style={styles.cardLine}>El porcentaje adicional se suma al base cuando el referente supera el mínimo de referidos activos.</Text>

        {tiers.map((t) => (
          <View key={t.id} style={styles.tierRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierLabel}>{t.label}</Text>
              <Text style={styles.tierMeta}>≥ {t.minActiveReferrals} activos → +{Number(t.bonusPercent).toFixed(2)}%  {t.isActive ? "✓" : "desactivado"}</Text>
            </View>
            <Pressable onPress={() => void handleDeleteTier(t.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Eliminar</Text>
            </Pressable>
          </View>
        ))}

        {tiers.length === 0 ? <Text style={styles.cardLine}>Sin tiers configurados.</Text> : null}

        <View style={styles.tierForm}>
          <TextInput value={tierLabel} onChangeText={setTierLabel} placeholder="Nombre (ej: Bronce)" placeholderTextColor={appTheme.colors.textMuted} style={styles.input} />
          <TextInput value={tierMin} onChangeText={setTierMin} placeholder="Mín. referidos" placeholderTextColor={appTheme.colors.textMuted} keyboardType="number-pad" style={styles.input} />
          <TextInput value={tierBonus} onChangeText={setTierBonus} placeholder="Bonus %" placeholderTextColor={appTheme.colors.textMuted} keyboardType="decimal-pad" style={styles.input} />
          <View style={styles.toggleRow}>
            <Text style={styles.cardLine}>Activo</Text>
            <Switch value={tierActive} onValueChange={setTierActive} />
          </View>
          <Pressable style={[styles.addBtn, savingTier && { opacity: 0.6 }]} disabled={savingTier} onPress={() => void handleAddTier()}>
            <Text style={styles.addBtnText}>{savingTier ? "Guardando..." : "Agregar tier"}</Text>
          </Pressable>
        </View>
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
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    gap: 8,
  },
  tierLabel: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  tierMeta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  deleteBtnText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  tierForm: {
    gap: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: appTheme.colors.background,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addBtn: {
    borderRadius: 10,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  addBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
});
