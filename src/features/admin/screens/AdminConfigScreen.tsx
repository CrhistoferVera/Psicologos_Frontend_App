import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
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
import { useAdminResponsive } from "../hooks/useAdminResponsive";

function ConfigField({
  label,
  description,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  unit,
}: {
  label: string;
  description: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  unit?: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldDescription}>{description}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={appTheme.colors.textMuted}
          keyboardType={keyboardType}
          style={styles.input}
        />
        {unit ? <Text style={styles.unitLabel}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function FlagRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.flagRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.flagTitle}>{title}</Text>
        <Text style={styles.flagDescription}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export default function AdminConfigScreen() {
  const { isMobile, contentPadding } = useAdminResponsive();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grants, setGrants] = useState<any[]>([]);

  const [platformFeePercent, setPlatformFeePercent] = useState("50");
  const [creditValueBs, setCreditValueBs] = useState("1");
  const [referralPercentage, setReferralPercentage] = useState("2.5");
  const [referralRewardCredits, setReferralRewardCredits] = useState("10");
  const [referralMinDepositAmount, setReferralMinDepositAmount] = useState("0");
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);

  const [savingConfig, setSavingConfig] = useState(false);

  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("20");
  const [reason, setReason] = useState("Crédito promocional administrativo");
  const [savingGrant, setSavingGrant] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [config, grantsData] = await Promise.all([getAdminConfig(), getPromotionalCreditGrants(30)]);
      setPlatformFeePercent(String(config.platformFeePercent));
      setCreditValueBs(String(config.creditValueBs ?? config.creditToSolesRate));
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
    const creditValue = Number(creditValueBs);
    const refPct = Number(referralPercentage);
    const rewardCredits = Number(referralRewardCredits);
    const minDeposit = Number(referralMinDepositAmount);

    if (!Number.isFinite(platform) || platform < 0 || platform > 100) {
      Alert.alert("Porcentaje inválido", "La comisión de plataforma debe estar entre 0 y 100.");
      return;
    }
    if (!Number.isFinite(creditValue) || creditValue < 0) {
      Alert.alert("Valor inválido", "El valor de 1 crédito en Bs debe ser mayor o igual a 0.");
      return;
    }
    if (!Number.isFinite(refPct) || refPct < 0 || refPct > 100) {
      Alert.alert("Porcentaje inválido", "El porcentaje de referidos debe estar entre 0 y 100.");
      return;
    }
    if (!Number.isFinite(rewardCredits) || rewardCredits < 0) {
      Alert.alert("Recompensa inválida", "La recompensa fija de referidos debe ser mayor o igual a 0.");
      return;
    }
    if (!Number.isFinite(minDeposit) || minDeposit < 0) {
      Alert.alert("Monto inválido", "El mínimo de depósito para referidos debe ser mayor o igual a 0.");
      return;
    }

    try {
      setSavingConfig(true);
      await updateAdminConfig({
        platformFeePercent: platform,
        creditValueBs: creditValue,
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
      Alert.alert("Créditos otorgados", "El crédito promocional se registró correctamente.");
      setUserId("");
      setReason("Crédito promocional administrativo");
      await loadData();
    } catch (err: any) {
      Alert.alert("No se pudo otorgar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setSavingGrant(false);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}>
      {loading ? <Text style={styles.info}>Cargando configuración...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppCard>
        <Text style={styles.cardTitle}>Parámetros globales del sistema</Text>
        <Text style={styles.cardIntro}>Define reglas de monetización, referidos y disponibilidad operativa.</Text>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Créditos y comisiones</Text>
          <ConfigField
            label="Comisión de plataforma"
            description="Porcentaje que retiene la plataforma sobre transacciones pagadas al profesional."
            value={platformFeePercent}
            onChangeText={setPlatformFeePercent}
            placeholder="Ej: 45"
            keyboardType="decimal-pad"
            unit="%"
          />
          <ConfigField
            label="Valor de 1 crédito"
            description="Define la equivalencia de un crédito en bolivianos (Bs)."
            value={creditValueBs}
            onChangeText={setCreditValueBs}
            placeholder="Ej: 2.50"
            keyboardType="decimal-pad"
            unit="Bs"
          />
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Programa de referidos</Text>
          <ConfigField
            label="Porcentaje de referido"
            description="Porcentaje de recompensa para el referente sobre ganancias elegibles del referido."
            value={referralPercentage}
            onChangeText={setReferralPercentage}
            placeholder="Ej: 2.5"
            keyboardType="decimal-pad"
            unit="%"
          />
          <ConfigField
            label="Recompensa fija (legado)"
            description="Valor legado en créditos. Mantener en 0 si se usa solo porcentaje."
            value={referralRewardCredits}
            onChangeText={setReferralRewardCredits}
            placeholder="Ej: 0"
            keyboardType="decimal-pad"
            unit="cr"
          />
          <ConfigField
            label="Mínimo de depósito para referido"
            description="Monto mínimo para que una recarga califique en reglas de referidos."
            value={referralMinDepositAmount}
            onChangeText={setReferralMinDepositAmount}
            placeholder="Ej: 0"
            keyboardType="decimal-pad"
            unit="Bs"
          />
          <FlagRow
            title="Programa de referidos habilitado"
            description="Activa o desactiva el cómputo de recompensas por referidos."
            value={referralEnabled}
            onChange={setReferralEnabled}
          />
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>Estado operativo</Text>
          <FlagRow
            title="Pagos habilitados"
            description="Permite o bloquea recargas y cobros de créditos en la plataforma."
            value={paymentsEnabled}
            onChange={setPaymentsEnabled}
          />
          <FlagRow
            title="Retiros habilitados"
            description="Permite o bloquea solicitudes de retiro para profesionales."
            value={withdrawalsEnabled}
            onChange={setWithdrawalsEnabled}
          />
        </View>

        <Pressable
          style={[styles.primaryBtn, savingConfig && { opacity: 0.6 }]}
          disabled={savingConfig}
          onPress={() => void handleSaveConfig()}
        >
          <Text style={styles.primaryBtnText}>{savingConfig ? "Guardando..." : "Guardar parámetros globales"}</Text>
        </Pressable>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Créditos promocionales</Text>
        <Text style={styles.note}>Otorga créditos manuales a usuarios sin afectar ingresos reales del profesional.</Text>
        <View style={[styles.formGrid, { flexDirection: isMobile ? "column" : "row" }]}>
          <TextInput
            value={userId}
            onChangeText={setUserId}
            placeholder="User ID destinatario"
            placeholderTextColor={appTheme.colors.textMuted}
            style={[styles.input, { minWidth: isMobile ? 0 : 190, width: isMobile ? "100%" : undefined }]}
          />
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Monto en créditos"
            placeholderTextColor={appTheme.colors.textMuted}
            keyboardType="numeric"
            style={[styles.input, { minWidth: isMobile ? 0 : 190, width: isMobile ? "100%" : undefined }]}
          />
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Motivo (opcional)"
            placeholderTextColor={appTheme.colors.textMuted}
            style={[styles.input, { minWidth: isMobile ? 0 : 240, width: isMobile ? "100%" : undefined }]}
          />
          <Pressable
            style={[styles.primaryBtn, savingGrant && { opacity: 0.6 }]}
            disabled={savingGrant}
            onPress={() => void handleGrantCredits()}
          >
            <Text style={styles.primaryBtnText}>{savingGrant ? "Guardando..." : "Otorgar créditos"}</Text>
          </Pressable>
        </View>
      </AppCard>

      <Text style={styles.sectionTitle}>Últimos créditos promocionales otorgados</Text>
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
  cardTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  cardIntro: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  sectionBlock: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    paddingTop: 10,
  },
  sectionHeader: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },
  fieldBlock: {
    gap: 4,
  },
  fieldLabel: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  fieldDescription: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
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
  unitLabel: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    minWidth: 30,
    textAlign: "right",
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  flagTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  flagDescription: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  note: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
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
