import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import {
  getAdminConfig,
  getPromotionalCreditGrants,
  grantPromotionalCredits,
  updateAdminConfig,
} from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";

export default function AdminConfigScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grants, setGrants] = useState<any[]>([]);

  const [platformFeePercent, setPlatformFeePercent] = useState("50");
  const [creditToSolesRate, setCreditToSolesRate] = useState("1");
  const [minAppVersion, setMinAppVersion] = useState("1.0");
  const [referralPercentage, setReferralPercentage] = useState("2.5");
  const [referralRewardCredits, setReferralRewardCredits] = useState("10");
  const [referralMinDepositAmount, setReferralMinDepositAmount] = useState("0");
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);

  const [savingConfig, setSavingConfig] = useState(false);

  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("20");
  const [reason, setReason] = useState("Crédito promocional admin");
  const [savingGrant, setSavingGrant] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [config, grantsData] = await Promise.all([getAdminConfig(), getPromotionalCreditGrants(30)]);

      setPlatformFeePercent(String(config.platformFeePercent));
      setCreditToSolesRate(String(config.creditToSolesRate));
      setMinAppVersion(config.minAppVersion);
      setReferralPercentage(String(config.referralPercentage ?? 2.5));
      setReferralRewardCredits(String(config.referralRewardCredits));
      setReferralMinDepositAmount(String(config.referralMinDepositAmount));
      setReferralEnabled(Boolean(config.referralEnabled));
      setPaymentsEnabled(Boolean(config.paymentsEnabled));
      setWithdrawalsEnabled(Boolean(config.withdrawalsEnabled));

      setGrants(grantsData);
    } catch {
      setError("No se pudo cargar la configuración del sistema.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSaveConfig() {
    const platform = Number(platformFeePercent);
    const creditRate = Number(creditToSolesRate);
    const refPct = Number(referralPercentage);
    const rewardCredits = Number(referralRewardCredits);
    const minDeposit = Number(referralMinDepositAmount);

    if (!Number.isFinite(platform) || platform < 0 || platform > 100) {
      Alert.alert("Porcentaje inválido", "El porcentaje de plataforma debe estar entre 0 y 100.");
      return;
    }

    if (!Number.isFinite(creditRate) || creditRate < 0) {
      Alert.alert("Rate inválido", "El rate de crédito debe ser un número mayor o igual a 0.");
      return;
    }

    if (!Number.isFinite(refPct) || refPct < 0 || refPct > 100) {
      Alert.alert("Porcentaje de referido inválido", "Debe estar entre 0 y 100.");
      return;
    }

    if (!Number.isFinite(rewardCredits) || rewardCredits < 0) {
      Alert.alert("Recompensa inválida", "La recompensa por referido debe ser mayor o igual a 0.");
      return;
    }

    if (!Number.isFinite(minDeposit) || minDeposit < 0) {
      Alert.alert("Monto inválido", "El mínimo de depósito debe ser mayor o igual a 0.");
      return;
    }

    try {
      setSavingConfig(true);
      await updateAdminConfig({
        platformFeePercent: platform,
        creditToSolesRate: creditRate,
        minAppVersion: minAppVersion.trim() || "1.0",
        referralPercentage: refPct,
        referralRewardCredits: rewardCredits,
        referralMinDepositAmount: minDeposit,
        referralEnabled,
        paymentsEnabled,
        withdrawalsEnabled,
      });
      Alert.alert("Configuración guardada", "Los parámetros globales se actualizaron correctamente.");
      await loadData();
    } catch (err: any) {
      Alert.alert("No se pudo guardar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleGrantCredits() {
    const parsedAmount = Number(amount);
    if (!userId.trim()) {
      Alert.alert("User ID requerido", "Ingresa el ID del usuario destinatario.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Monto inválido", "Ingresa una cantidad válida de créditos.");
      return;
    }

    try {
      setSavingGrant(true);
      await grantPromotionalCredits({
        userId: userId.trim(),
        amount: parsedAmount,
        reason: reason.trim() || undefined,
      });
      Alert.alert("Créditos otorgados", "El grant promocional se registró correctamente.");
      setUserId("");
      setReason("Crédito promocional admin");
      await loadData();
    } catch (err: any) {
      Alert.alert("No se pudo otorgar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setSavingGrant(false);
    }
  }

  return (
    <View style={styles.page}>
      {loading ? <Text style={styles.info}>Cargando configuración...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppCard>
        <Text style={styles.cardTitle}>Parámetros globales</Text>

        <View style={styles.formGrid}>
          <TextInput
            value={platformFeePercent}
            onChangeText={setPlatformFeePercent}
            placeholder="% plataforma"
            placeholderTextColor={appTheme.colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            value={creditToSolesRate}
            onChangeText={setCreditToSolesRate}
            placeholder="Rate crédito/Bs"
            placeholderTextColor={appTheme.colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            value={minAppVersion}
            onChangeText={setMinAppVersion}
            placeholder="Versión mínima"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />
          <TextInput
            value={referralPercentage}
            onChangeText={setReferralPercentage}
            placeholder="% referido (ej: 2.5)"
            placeholderTextColor={appTheme.colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            value={referralRewardCredits}
            onChangeText={setReferralRewardCredits}
            placeholder="Reward fijo referido (legado)"
            placeholderTextColor={appTheme.colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            value={referralMinDepositAmount}
            onChangeText={setReferralMinDepositAmount}
            placeholder="Mín depósito referido"
            placeholderTextColor={appTheme.colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.line}>Programa de referidos habilitado</Text>
          <Switch value={referralEnabled} onValueChange={setReferralEnabled} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.line}>Pagos habilitados</Text>
          <Switch value={paymentsEnabled} onValueChange={setPaymentsEnabled} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.line}>Retiros habilitados</Text>
          <Switch value={withdrawalsEnabled} onValueChange={setWithdrawalsEnabled} />
        </View>

        <Pressable style={[styles.primaryBtn, savingConfig && { opacity: 0.6 }]} disabled={savingConfig} onPress={() => void handleSaveConfig()}>
          <Text style={styles.primaryBtnText}>{savingConfig ? "Guardando..." : "Guardar configuración"}</Text>
        </Pressable>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Créditos promocionales</Text>
        <Text style={styles.note}>Otorga créditos promocionales sin afectar revenue contable.</Text>
        <View style={styles.formGrid}>
          <TextInput
            value={userId}
            onChangeText={setUserId}
            placeholder="User ID destinatario"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Monto"
            placeholderTextColor={appTheme.colors.textMuted}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Motivo (opcional)"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />
          <Pressable style={[styles.primaryBtn, savingGrant && { opacity: 0.6 }]} disabled={savingGrant} onPress={() => void handleGrantCredits()}>
            <Text style={styles.primaryBtnText}>{savingGrant ? "Guardando..." : "Otorgar créditos"}</Text>
          </Pressable>
        </View>
      </AppCard>

      <Text style={styles.sectionTitle}>Últimos grants promocionales</Text>
      {grants.length === 0 ? (
        <AdminEmptyState title="Sin grants recientes" description="Aún no hay créditos promocionales otorgados." />
      ) : (
        <AdminDataTable
          rows={grants}
          columns={[
            {
              key: "recipient",
              title: "Usuario",
              width: 220,
              render: (row) => (
                <Text style={styles.cellPrimary}>
                  {[row.recipient?.firstName, row.recipient?.lastName].filter(Boolean).join(" ") || row.recipient?.email || "Usuario"}
                </Text>
              ),
            },
            {
              key: "amount",
              title: "Monto",
              width: 120,
              render: (row) => <Text style={styles.cellPrimary}>{Number(row.amount ?? 0).toFixed(2)} cr</Text>,
            },
            {
              key: "reason",
              title: "Motivo",
              width: 280,
              render: (row) => <Text style={styles.cellMuted}>{row.reason ?? "-"}</Text>,
            },
            {
              key: "admin",
              title: "Otorgado por",
              width: 180,
              render: (row) => (
                <Text style={styles.cellMuted}>
                  {[row.admin?.firstName, row.admin?.lastName].filter(Boolean).join(" ") || row.admin?.email || "Admin"}
                </Text>
              ),
            },
            {
              key: "date",
              title: "Fecha",
              width: 130,
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
  cardTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  line: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  note: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  input: {
    minWidth: 190,
    flexGrow: 1,
    backgroundColor: appTheme.colors.background,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  primaryBtn: {
    borderRadius: 10,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
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
});
