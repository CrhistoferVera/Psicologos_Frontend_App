import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppCard from "../../../components/ui/AppCard";
import { appTheme } from "../../../theme/appTheme";
import { formatBob, formatUsd } from "../../../utils/money";
import WithdrawalFormTab from "./WithdrawalFormTab";
import type { BankAccount } from "../../../api/wallet";

interface Props {
  withdrawableBalance: number;
  totalBalance: number;
  totalBalanceUsd: number;
  today: number;
  todayUsd: number;
  thisWeek: number;
  thisWeekUsd: number;
  grossBob: number;
  withdrawalsEnabled: boolean;
  // Withdrawal form
  withdrawCurrency: "BOB" | "USD";
  onWithdrawCurrencyChange: (currency: "BOB" | "USD") => void;
  accountsForCurrency: BankAccount[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
  cryptoAddress: string;
  onCryptoAddressChange: (address: string) => void;
  withdrawAmount: string;
  onWithdrawAmountChange: (amount: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onHistoryPress: () => void;
  onAccountsPress: () => void;
}

export default function ResumenTab({
  withdrawableBalance,
  totalBalance,
  totalBalanceUsd,
  today,
  todayUsd,
  thisWeek,
  thisWeekUsd,
  grossBob,
  withdrawalsEnabled,
  withdrawCurrency,
  onWithdrawCurrencyChange,
  accountsForCurrency,
  selectedAccountId,
  onSelectAccount,
  cryptoAddress,
  onCryptoAddressChange,
  withdrawAmount,
  onWithdrawAmountChange,
  isLoading,
  onSubmit,
  onHistoryPress,
  onAccountsPress,
}: Props) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Cartera Bolivianos (Bs)</Text>
        <Text style={styles.heroValue}>{formatBob(withdrawableBalance)}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>Hoy: {formatBob(today)}</Text>
          <Text style={styles.heroMeta}>Semana: {formatBob(thisWeek)}</Text>
        </View>
        {!withdrawalsEnabled ? (
          <Text style={styles.blockedText}>Retiros deshabilitados por configuración del sistema.</Text>
        ) : null}
      </View>

      <View style={[styles.heroCard, styles.heroCardUsd]}>
        <Text style={styles.heroLabel}>Cartera Dólares (USD)</Text>
        <Text style={styles.heroValue}>{formatUsd(totalBalanceUsd)}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>Hoy: {formatUsd(todayUsd)}</Text>
          <Text style={styles.heroMeta}>Semana: {formatUsd(thisWeekUsd)}</Text>
        </View>
      </View>

      <View style={styles.kpisRow}>
        <AppCard style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{formatBob(grossBob)}</Text>
          <Text style={styles.kpiLabel}>Ingresos históricos Bs</Text>
        </AppCard>
        <AppCard style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{formatBob(totalBalance)}</Text>
          <Text style={styles.kpiLabel}>Saldo actual</Text>
        </AppCard>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtnHistory} onPress={onHistoryPress}>
          <View style={styles.actionIconWrap}>
            <Ionicons name="time" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.actionBtnHistoryText}>Historial</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ opacity: 0.8 }} />
        </Pressable>
        <Pressable style={styles.actionBtnAccounts} onPress={onAccountsPress}>
          <View style={styles.actionIconWrapAccounts}>
            <Ionicons name="card" size={22} color={appTheme.colors.primary} />
          </View>
          <Text style={styles.actionBtnAccountsText}>Cuentas</Text>
          <Ionicons name="arrow-forward" size={14} color={appTheme.colors.primary} style={{ opacity: 0.6 }} />
        </Pressable>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Solicitar retiro</Text>

      <WithdrawalFormTab
        withdrawCurrency={withdrawCurrency}
        onWithdrawCurrencyChange={onWithdrawCurrencyChange}
        accountsForCurrency={accountsForCurrency}
        selectedAccountId={selectedAccountId}
        onSelectAccount={onSelectAccount}
        cryptoAddress={cryptoAddress}
        onCryptoAddressChange={onCryptoAddressChange}
        withdrawAmount={withdrawAmount}
        onWithdrawAmountChange={onWithdrawAmountChange}
        withdrawableBalance={withdrawableBalance}
        totalBalanceUsd={totalBalanceUsd}
        withdrawalsEnabled={withdrawalsEnabled}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: appTheme.colors.background },
  container: { paddingBottom: 20, gap: 12 },
  heroCard: {
    borderRadius: 20,
    backgroundColor: "#3E7F61",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 8,
  },
  heroCardUsd: { backgroundColor: "#1E4D7B" },
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
  heroMetaRow: { gap: 2 },
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
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtnHistory: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    backgroundColor: appTheme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowColor: appTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  actionBtnHistoryText: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },
  actionBtnAccounts: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnAccountsText: {
    flex: 1,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconWrapAccounts: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
});
