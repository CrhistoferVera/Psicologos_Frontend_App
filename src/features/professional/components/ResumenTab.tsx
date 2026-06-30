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
  lockedBob: number;
  totalBalanceUsd: number;
  lockedUsd: number;
  withdrawableUsd: number;
  debtBob: number;
  debtUsd: number;
  isBlocked: boolean;
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
  lockedBob,
  totalBalanceUsd,
  lockedUsd,
  withdrawableUsd,
  debtBob,
  debtUsd,
  isBlocked,
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
        <Text style={styles.heroBreakdownMeta}>
          {lockedBob > 0
            ? `Total: ${formatBob(totalBalance)}  ·  Bloqueado: ${formatBob(lockedBob)}`
            : `Total: ${formatBob(totalBalance)}`}
        </Text>
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
        <Text style={styles.heroValue}>{formatUsd(withdrawableUsd)}</Text>
        <Text style={styles.heroBreakdownMeta}>
          {lockedUsd > 0
            ? `Total: ${formatUsd(totalBalanceUsd)}  ·  Bloqueado: ${formatUsd(lockedUsd)}`
            : `Total: ${formatUsd(totalBalanceUsd)}`}
        </Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMeta}>Hoy: {formatUsd(todayUsd)}</Text>
          <Text style={styles.heroMeta}>Semana: {formatUsd(thisWeekUsd)}</Text>
        </View>
      </View>

      {(debtBob > 0 || debtUsd > 0) && (
        <View style={styles.debtBanner}>
          <View style={styles.debtBannerHeader}>
            <Ionicons name="warning" size={18} color="#92400E" />
            <Text style={styles.debtBannerTitle}>Deuda pendiente por no-show</Text>
          </View>
          {debtBob > 0 && (
            <Text style={styles.debtBannerAmount}>- {formatBob(debtBob)}</Text>
          )}
          {debtUsd > 0 && (
            <Text style={styles.debtBannerAmount}>- {formatUsd(debtUsd)}</Text>
          )}
          {isBlocked && (
            <Text style={styles.debtBannerNote}>
              Tu cuenta está bloqueada. La deuda se descuenta automáticamente cuando recibas ganancias de nuevas sesiones.
            </Text>
          )}
        </View>
      )}

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
        withdrawableUsd={withdrawableUsd}
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
  heroBreakdownMeta: {
    color: "#D7EFE3",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    opacity: 0.8,
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
  debtBanner: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  debtBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  debtBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
    flex: 1,
  },
  debtBannerAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#DC2626",
    fontFamily: appTheme.fonts.heading,
  },
  debtBannerNote: {
    fontSize: 12,
    color: "#92400E",
    lineHeight: 17,
    marginTop: 2,
  },
});
