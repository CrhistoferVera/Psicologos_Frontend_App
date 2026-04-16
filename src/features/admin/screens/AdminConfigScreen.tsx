import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { getPublicSystemConfig, getPromotionalCreditGrants, grantPromotionalCredits } from "../api/adminApi";
import AdminDataTable from "../components/AdminDataTable";
import AdminEmptyState from "../components/AdminEmptyState";

export default function AdminConfigScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemConfig, setSystemConfig] = useState<{ creditToSolesRate?: number; minVersion?: string } | null>(null);
  const [grants, setGrants] = useState<any[]>([]);

  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("20");
  const [reason, setReason] = useState("Credito promocional admin");
  const [savingGrant, setSavingGrant] = useState(false);

  const [paymentsEnabled, setPaymentsEnabled] = useState(true);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [config, grantsData] = await Promise.all([getPublicSystemConfig(), getPromotionalCreditGrants(30)]);
      setSystemConfig(config);
      setGrants(grantsData);
    } catch {
      setError("No se pudo cargar la configuracion del sistema.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleGrantCredits() {
    const parsedAmount = Number(amount);
    if (!userId.trim()) {
      Alert.alert("User ID requerido", "Ingresa el ID del usuario destinatario.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Monto invalido", "Ingresa una cantidad valida de creditos.");
      return;
    }

    try {
      setSavingGrant(true);
      await grantPromotionalCredits({
        userId: userId.trim(),
        amount: parsedAmount,
        reason: reason.trim() || undefined,
      });
      Alert.alert("Creditos otorgados", "El grant promocional se registro correctamente.");
      setUserId("");
      setReason("Credito promocional admin");
      await loadData();
    } catch (err: any) {
      Alert.alert("No se pudo otorgar", err?.message ?? "Intenta nuevamente.");
    } finally {
      setSavingGrant(false);
    }
  }

  return (
    <View style={styles.page}>
      {loading ? <Text style={styles.info}>Cargando configuracion...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.row}>
        <AppCard style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Parametros globales</Text>
          <Text style={styles.line}>Rate credito/soles: {Number(systemConfig?.creditToSolesRate ?? 1).toFixed(2)}</Text>
          <Text style={styles.line}>Version minima: {systemConfig?.minVersion ?? "1.0"}</Text>
          <Text style={styles.note}>Fuente: endpoint `/users/config`.</Text>
        </AppCard>

        <AppCard style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Toggles operativos (MVP)</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.line}>Pagos habilitados</Text>
            <Switch value={paymentsEnabled} onValueChange={setPaymentsEnabled} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.line}>Retiros habilitados</Text>
            <Switch value={withdrawalsEnabled} onValueChange={setWithdrawalsEnabled} />
          </View>
          <Text style={styles.note}>TODO: persistir toggles en endpoint admin/config del backend.</Text>
        </AppCard>
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Creditos promocionales</Text>
        <Text style={styles.note}>Otorga creditos promocionales sin afectar revenue contable.</Text>
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
            <Text style={styles.primaryBtnText}>{savingGrant ? "Guardando..." : "Otorgar creditos"}</Text>
          </Pressable>
        </View>
      </AppCard>

      <Text style={styles.sectionTitle}>Ultimos grants promocionales</Text>
      {grants.length === 0 ? (
        <AdminEmptyState title="Sin grants recientes" description="Aun no hay creditos promocionales otorgados." />
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
  row: {
    flexDirection: "row",
    gap: 10,
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
