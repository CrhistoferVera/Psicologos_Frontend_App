import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../../components/ui/AppScreen";
import AppAlert from "../../../components/ui/AppAlert";
import { appTheme } from "../../../theme/appTheme";
import { apiGetConfig } from "../../../api/userClient";
import type { Bank, BankAccount } from "../../../api/wallet";
import {
  addProfessionalBankAccount,
  getProfessionalBankAccounts,
  getProfessionalBanks,
  getProfessionalEarningsData,
  removeProfessionalBankAccount,
  requestProfessionalWithdrawal,
} from "../api/professionalApi";
import ResumenTab from "../components/ResumenTab";
import BankAccountsTab from "../components/BankAccountsTab";

type TabKey = "resumen" | "accounts";

export default function ProfessionalEarningsScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("resumen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [earnings, setEarnings] = useState<any>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);

  // Withdrawal form state
  const [withdrawCurrency, setWithdrawCurrency] = useState<"BOB" | "USD">("BOB");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [cryptoAddress, setCryptoAddress] = useState<string>("");
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);

  // Bank account form state
  const [newBankId, setNewBankId] = useState<number | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ type: "error"|"warning"|"success"|"info"; title: string; message: string } | null>(null);

  function showAlert(type: "error"|"warning"|"success"|"info", title: string, message: string) {
    setAlertConfig({ type, title, message });
  }
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  async function loadAll() {
    try {
      setLoading(true);
      setError(null);
      const [earningsData, banksData, accountsData, configData] = await Promise.all([
        getProfessionalEarningsData(),
        getProfessionalBanks(),
        getProfessionalBankAccounts(),
        apiGetConfig(),
      ]);

      setEarnings(earningsData);
      setBanks(banksData);
      setBankAccounts(accountsData);
      setWithdrawalsEnabled(Boolean(earningsData?.withdrawalsEnabled ?? configData.withdrawalsEnabled ?? true));

      if (accountsData.length > 0) {
        const currentStillExists = accountsData.some((account) => account.id === selectedAccountId);
        if (!currentStillExists) {
          const firstMatch = accountsData.find((a) => (a.currency ?? "BOB") === withdrawCurrency);
          setSelectedAccountId(firstMatch?.id ?? "");
        }
      } else {
        setSelectedAccountId("");
      }
    } catch {
      setError("No se pudo cargar el módulo de ganancias y retiros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const grossByCurrency = useMemo(() => {
    if (!Array.isArray(earnings?.transactions)) return { bob: 0, usd: 0 };
    return earnings.transactions.reduce(
      (acc: { bob: number; usd: number }, tx: any) => {
        const currency = String(tx?.currency ?? "BOB").toUpperCase();
        if (currency === "USD") {
          acc.usd += Number(tx.amount ?? 0);
        } else {
          acc.bob += Number(tx.amount ?? 0);
        }
        return acc;
      },
      { bob: 0, usd: 0 },
    );
  }, [earnings]);

  const totalBalance = Number(earnings?.balance ?? earnings?.total ?? 0);
  const totalBalanceUsd = Number(earnings?.balanceUsd ?? 0);
  const withdrawableBalance = Number(
    earnings?.withdrawableBalance ?? earnings?.realBalance ?? Math.max(totalBalance - Number(earnings?.promotionalBalance ?? 0), 0),
  );
  const thisWeek = Number(earnings?.thisWeek ?? 0);
  const thisWeekUsd = Number(earnings?.thisWeekUsd ?? 0);
  const today = Number(earnings?.today ?? 0);
  const todayUsd = Number(earnings?.todayUsd ?? 0);

  const accountsForWithdrawCurrency = bankAccounts.filter((a) => (a.currency ?? "BOB") === withdrawCurrency);

  async function handleAddBankAccount(accountNumber: string, accountHolderName: string) {
    if (!newBankId) {
      setError("Selecciona un banco.");
      return;
    }
    try {
      setCreatingAccount(true);
      setError(null);
      await addProfessionalBankAccount({
        bankId: newBankId,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim() || undefined,
        currency: "BOB",
      });
      setNewBankId(null);
      await loadAll();
      showAlert("success", "Éxito", "Cuenta bancaria agregada correctamente.");
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
      const msg = err?.response?.data?.message ?? err?.message ?? "No se pudo eliminar la cuenta.";
      showAlert("error", "No se pudo eliminar", msg);
    } finally {
      setDeletingAccountId(null);
    }
  }

  async function handleCreateWithdrawal() {
    const amount = Number(withdrawAmount);
    if (!withdrawalsEnabled) {
      showAlert("error", "Retiros deshabilitados", "Los retiros se encuentran temporalmente deshabilitados.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      showAlert("warning", "Monto inválido", "Ingresa un monto válido mayor a 0.");
      return;
    }

    const available = withdrawCurrency === "USD" ? totalBalanceUsd : withdrawableBalance;
    if (amount > available) {
      showAlert("warning", "Saldo insuficiente", `Saldo disponible: ${available.toFixed(2)}.`);
      return;
    }

    if (withdrawCurrency === "BOB") {
      if (!selectedAccountId || !/^\d+$/.test(selectedAccountId)) {
        showAlert("warning", "Cuenta requerida", "Selecciona una cuenta bancaria para el retiro.");
        return;
      }
    } else {
      if (!cryptoAddress.trim()) {
        showAlert("warning", "Dirección requerida", "Ingresa la dirección de tu wallet crypto.");
        return;
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(cryptoAddress.trim())) {
        showAlert("warning", "Dirección inválida", "La dirección debe comenzar con 0x seguido de 40 caracteres hexadecimales.");
        return;
      }
    }

    try {
      setRequestingWithdrawal(true);
      setError(null);

      if (withdrawCurrency === "BOB") {
        await requestProfessionalWithdrawal({
          credits: amount,
          method: "BANK_TRANSFER",
          bankAccountId: selectedAccountId,
          currency: "BOB",
        });
      } else {
        await requestProfessionalWithdrawal({
          credits: amount,
          method: "CRYPTO",
          cryptoAddress: cryptoAddress.trim(),
          cryptoCurrency: "USDT",
          cryptoNetwork: "BEP20",
          currency: "USD",
        });
      }

      setWithdrawAmount("");
      setCryptoAddress("");
      await loadAll();

      showAlert("success", "Solicitud enviada", withdrawCurrency === "BOB"
          ? "Tu solicitud de retiro fue registrada. El plazo es de hasta 48 horas hábiles."
          : "Tu solicitud de retiro en USDT (BEP20) fue registrada. El plazo es de hasta 72 horas hábiles.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "No se pudo registrar la solicitud de retiro.";
      showAlert("error", "Error en el retiro", msg);
    } finally {
      setRequestingWithdrawal(false);
    }
  }

  return (
    <>
      <AppScreen scroll={false} contentPadding={0}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => activeTab === "accounts" ? setActiveTab("resumen") : router.back()}>
          <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
        </Pressable>
        <Text style={styles.title}>{activeTab === "accounts" ? "Cuentas" : "Ganancias y retiros"}</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Cargando información...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={36} color={appTheme.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void loadAll()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.contentWrap}>
          {activeTab === "resumen" ? (
            <ResumenTab
              withdrawableBalance={withdrawableBalance}
              totalBalance={totalBalance}
              totalBalanceUsd={totalBalanceUsd}
              today={today}
              todayUsd={todayUsd}
              thisWeek={thisWeek}
              thisWeekUsd={thisWeekUsd}
              grossBob={grossByCurrency.bob}
              withdrawalsEnabled={withdrawalsEnabled}
              withdrawCurrency={withdrawCurrency}
              onWithdrawCurrencyChange={(c) => {
                setWithdrawCurrency(c);
                setSelectedAccountId("");
              }}
              accountsForCurrency={accountsForWithdrawCurrency}
              selectedAccountId={selectedAccountId}
              onSelectAccount={setSelectedAccountId}
              cryptoAddress={cryptoAddress}
              onCryptoAddressChange={setCryptoAddress}
              withdrawAmount={withdrawAmount}
              onWithdrawAmountChange={setWithdrawAmount}
              isLoading={requestingWithdrawal}
              onSubmit={() => void handleCreateWithdrawal()}
              onHistoryPress={() => router.push("/(professional)/earnings-history")}
              onAccountsPress={() => setActiveTab("accounts")}
            />
          ) : (
            <BankAccountsTab
              banks={banks}
              bankAccounts={bankAccounts}
              newBankId={newBankId}
              onBankIdChange={setNewBankId}
              isCreating={creatingAccount}
              isDeletingId={deletingAccountId}
              onAddAccount={(number, holderName) => void handleAddBankAccount(number, holderName)}
              onDeleteAccount={(id) => void handleDeleteBankAccount(id)}
              onBack={() => setActiveTab("resumen")}
            />
          )}
        </View>
      )}
    </AppScreen>
      <AppAlert
        visible={!!alertConfig}
        type={alertConfig?.type ?? "info"}
        title={alertConfig?.title ?? ""}
        message={alertConfig?.message ?? ""}
        onConfirm={() => setAlertConfig(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DEE6F1",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  title: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontSize: 24,
    fontWeight: "700",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  stateText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  errorText: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
  },
  retryBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
  },
  retryText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 14,
    backgroundColor: appTheme.colors.background,
  },
});
