import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { apiGetConfig } from "../../../api/userClient";
import type { Bank, BankAccount, WithdrawalRequest } from "../../../api/wallet";
import {
  addProfessionalBankAccount,
  getProfessionalBankAccounts,
  getProfessionalBanks,
  getProfessionalEarningsData,
  getProfessionalWithdrawalRequests,
  removeProfessionalBankAccount,
  requestProfessionalWithdrawal,
} from "../api/professionalApi";

function formatMoney(value: number) {
  return `Bs ${Number(value || 0).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(iso?: string) {
  if (!iso) return "Sin fecha";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function withdrawalStatusMeta(status: WithdrawalRequest["status"]) {
  if (status === "APPROVED") return { label: "APROBADO", bg: "#DCFCE7", text: "#166534" };
  if (status === "REJECTED") return { label: "RECHAZADO", bg: "#FEE2E2", text: "#991B1B" };
  return { label: "PENDIENTE", bg: "#FEF3C7", text: "#92400E" };
}

export default function ProfessionalEarningsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [earnings, setEarnings] = useState<any>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);

  const [newBankId, setNewBankId] = useState<number | null>(null);
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolderName, setNewAccountHolderName] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [withdrawCreditsInput, setWithdrawCreditsInput] = useState("");
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);

  async function loadAll() {
    try {
      setLoading(true);
      setError(null);
      const [earningsData, banksData, accountsData, withdrawalsData, configData] = await Promise.all([
        getProfessionalEarningsData(),
        getProfessionalBanks(),
        getProfessionalBankAccounts(),
        getProfessionalWithdrawalRequests(),
        apiGetConfig(),
      ]);

      setEarnings(earningsData);
      setBanks(banksData);
      setBankAccounts(accountsData);
      setWithdrawals(withdrawalsData);
      setWithdrawalsEnabled(Boolean(earningsData?.withdrawalsEnabled ?? configData.withdrawalsEnabled ?? true));

      if (accountsData.length > 0) {
        const currentStillExists = accountsData.some((account) => account.id === selectedAccountId);
        if (!currentStillExists) setSelectedAccountId(accountsData[0].id);
      } else {
        setSelectedAccountId("");
      }
    } catch {
      setError("No se pudo cargar el modulo de retiros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const gross = useMemo(() => {
    if (!Array.isArray(earnings?.transactions)) return 0;
    return earnings.transactions.reduce((acc: number, tx: any) => acc + Number(tx.amount ?? 0), 0);
  }, [earnings]);

  const totalBalance = Number(earnings?.balance ?? earnings?.total ?? 0);
  const withdrawableBalance = Number(
    earnings?.withdrawableBalance ?? earnings?.realBalance ?? Math.max(totalBalance - Number(earnings?.promotionalBalance ?? 0), 0),
  );
  const thisWeek = Number(earnings?.thisWeek ?? 0);
  const today = Number(earnings?.today ?? 0);

  async function handleAddBankAccount() {
    if (!newBankId) {
      setError("Selecciona un banco.");
      return;
    }
    if (!newAccountNumber.trim()) {
      setError("Ingresa el numero de cuenta.");
      return;
    }

    try {
      setCreatingAccount(true);
      setError(null);
      await addProfessionalBankAccount({
        bankId: newBankId,
        accountNumber: newAccountNumber.trim(),
        accountHolderName: newAccountHolderName.trim() || undefined,
      });
      setNewAccountNumber("");
      setNewAccountHolderName("");
      await loadAll();
    } catch (err: any) {
      setError(err?.message ?? "No se pudo agregar la cuenta.");
    } finally {
      setCreatingAccount(false);
    }
  }

  async function handleDeleteBankAccount(accountId: string) {
    try {
      setDeletingAccountId(accountId);
      setError(null);
      await removeProfessionalBankAccount(accountId);
      await loadAll();
    } catch (err: any) {
      setError(err?.message ?? "No se pudo eliminar la cuenta.");
    } finally {
      setDeletingAccountId(null);
    }
  }

  async function handleCreateWithdrawal() {
    const credits = Number(withdrawCreditsInput);
    if (!withdrawalsEnabled) {
      setError("Los retiros estan deshabilitados temporalmente.");
      return;
    }
    if (!selectedAccountId) {
      setError("Selecciona una cuenta bancaria para el retiro.");
      return;
    }
    if (!Number.isFinite(credits) || credits <= 0) {
      setError("Ingresa un monto valido de creditos.");
      return;
    }

    try {
      setRequestingWithdrawal(true);
      setError(null);
      await requestProfessionalWithdrawal({
        credits,
        bankAccountId: selectedAccountId,
      });
      setWithdrawCreditsInput("");
      await loadAll();
    } catch (err: any) {
      setError(err?.message ?? "No se pudo registrar la solicitud de retiro.");
    } finally {
      setRequestingWithdrawal(false);
    }
  }

  return (
    <AppScreen scroll contentPadding={0}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
          </Pressable>
          <Text style={styles.title}>Ganancias y retiros</Text>
        </View>

        {loading ? <Text style={styles.info}>Cargando informacion...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Saldo disponible para retiro</Text>
          <Text style={styles.heroValue}>{formatMoney(withdrawableBalance)}</Text>
          <View style={styles.heroMetaRow}>
            <Text style={styles.heroMeta}>Saldo total: {formatMoney(totalBalance)}</Text>
            <Text style={styles.heroMeta}>Hoy: {formatMoney(today)}</Text>
            <Text style={styles.heroMeta}>Semana: {formatMoney(thisWeek)}</Text>
          </View>
          {!withdrawalsEnabled ? (
            <Text style={styles.blockedText}>Retiros deshabilitados por configuracion del sistema.</Text>
          ) : null}
        </View>

        <View style={styles.kpisRow}>
          <AppCard style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{formatMoney(gross)}</Text>
            <Text style={styles.kpiLabel}>Ingresos historicos</Text>
          </AppCard>
          <AppCard style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{formatMoney(totalBalance)}</Text>
            <Text style={styles.kpiLabel}>Wallet actual</Text>
          </AppCard>
        </View>

        <Text style={styles.sectionTitle}>Solicitar retiro</Text>
        <AppCard style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Cuenta de cobro</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={selectedAccountId}
              onValueChange={(value) => setSelectedAccountId(String(value ?? ""))}
              enabled={bankAccounts.length > 0}
            >
              {bankAccounts.length === 0 ? (
                <Picker.Item label="Agrega una cuenta bancaria primero" value="" />
              ) : null}
              {bankAccounts.map((account) => (
                <Picker.Item
                  key={account.id}
                  label={`${account.bankName} - ${account.accountNumber}`}
                  value={account.id}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.inputLabel}>Monto en creditos</Text>
          <TextInput
            value={withdrawCreditsInput}
            onChangeText={setWithdrawCreditsInput}
            keyboardType="numeric"
            placeholder="Ej: 120"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />

          <Pressable
            style={[
              styles.primaryBtn,
              (!withdrawalsEnabled || requestingWithdrawal || bankAccounts.length === 0) && styles.disabledBtn,
            ]}
            disabled={!withdrawalsEnabled || requestingWithdrawal || bankAccounts.length === 0}
            onPress={() => void handleCreateWithdrawal()}
          >
            <Text style={styles.primaryBtnText}>
              {requestingWithdrawal ? "Enviando solicitud..." : "Solicitar retiro"}
            </Text>
          </Pressable>
        </AppCard>

        <Text style={styles.sectionTitle}>Cuentas bancarias</Text>
        <AppCard style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Banco</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={newBankId ?? ""} onValueChange={(value) => setNewBankId(Number(value))}>
              <Picker.Item label="Selecciona un banco" value="" />
              {banks.map((bank) => (
                <Picker.Item key={bank.id} label={bank.name} value={bank.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.inputLabel}>Numero de cuenta</Text>
          <TextInput
            value={newAccountNumber}
            onChangeText={setNewAccountNumber}
            placeholder="Ej: 1234567890"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Titular (opcional)</Text>
          <TextInput
            value={newAccountHolderName}
            onChangeText={setNewAccountHolderName}
            placeholder="Nombre del titular"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />

          <Pressable
            style={[styles.secondaryBtn, creatingAccount && styles.disabledBtn]}
            disabled={creatingAccount}
            onPress={() => void handleAddBankAccount()}
          >
            <Text style={styles.secondaryBtnText}>
              {creatingAccount ? "Guardando..." : "Agregar cuenta bancaria"}
            </Text>
          </Pressable>

          <View style={styles.listWrap}>
            {bankAccounts.length === 0 ? (
              <Text style={styles.muted}>No tienes cuentas bancarias registradas.</Text>
            ) : (
              bankAccounts.map((account) => (
                <View key={account.id} style={styles.accountItem}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.accountTitle}>{account.bankName}</Text>
                    <Text style={styles.muted}>{account.accountNumber}</Text>
                    {account.accountHolderName ? <Text style={styles.muted}>{account.accountHolderName}</Text> : null}
                  </View>
                  <Pressable
                    onPress={() => void handleDeleteBankAccount(account.id)}
                    disabled={deletingAccountId === account.id}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>
                      {deletingAccountId === account.id ? "Eliminando..." : "Eliminar"}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </AppCard>

        <Text style={styles.sectionTitle}>Historial de retiros</Text>
        <View style={styles.historyList}>
          {withdrawals.length === 0 ? (
            <AppCard>
              <Text style={styles.muted}>Aun no tienes solicitudes de retiro.</Text>
            </AppCard>
          ) : (
            withdrawals.map((row) => {
              const status = withdrawalStatusMeta(row.status);
              return (
                <AppCard key={row.id} style={styles.historyItem}>
                  <View style={styles.historyTop}>
                    <Text style={styles.historyAmount}>
                      {Number(row.credits).toFixed(2)} cr ({formatMoney(Number(row.amountBs ?? row.soles ?? 0))})
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.muted}>
                    {row.bankName} - {row.accountNumber}
                  </Text>
                  {row.accountHolderName ? <Text style={styles.muted}>Titular: {row.accountHolderName}</Text> : null}
                  <Text style={styles.muted}>Solicitado: {formatDateTime(row.createdAt)}</Text>
                  <Text style={styles.muted}>Actualizado: {formatDateTime(row.updatedAt ?? row.createdAt)}</Text>
                  {row.rejectionReason ? (
                    <Text style={styles.rejectReason}>Motivo de rechazo: {row.rejectionReason}</Text>
                  ) : null}
                  {row.receiptUrl ? (
                    <Pressable onPress={() => void Linking.openURL(row.receiptUrl!)}>
                      <Text style={styles.receiptLink}>Ver comprobante</Text>
                    </Pressable>
                  ) : null}
                </AppCard>
              );
            })
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: appTheme.colors.background,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DEE6F1",
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontSize: 28,
    fontWeight: "700",
  },
  info: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 14,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 14,
  },
  heroCard: {
    marginHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#3E7F61",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 8,
  },
  heroLabel: {
    color: "#DDF3E7",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  heroValue: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
  },
  heroMetaRow: {
    gap: 2,
  },
  heroMeta: {
    color: "#D7EFE3",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  blockedText: {
    color: "#FDE68A",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    marginTop: 4,
  },
  kpisRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
  },
  kpiCard: {
    flex: 1,
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  kpiValue: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  kpiLabel: {
    marginTop: 4,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
    paddingHorizontal: 14,
    marginTop: 2,
  },
  sectionCard: {
    marginHorizontal: 14,
    gap: 8,
  },
  inputLabel: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  pickerWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: appTheme.colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryBtn: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.65,
  },
  listWrap: {
    marginTop: 4,
    gap: 8,
  },
  accountItem: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },
  muted: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  deleteBtn: {
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  deleteBtnText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  historyList: {
    paddingHorizontal: 14,
    gap: 8,
  },
  historyItem: {
    gap: 4,
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  historyAmount: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  rejectReason: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  receiptLink: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
});
