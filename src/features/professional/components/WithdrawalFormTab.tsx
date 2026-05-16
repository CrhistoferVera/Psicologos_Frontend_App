import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import type { BankAccount } from "../../../api/wallet";
import WithdrawalTypeSelector from "./WithdrawalTypeSelector";
import WithdrawalAmountInput from "./WithdrawalAmountInput";
import BankAccountPickerModal from "./BankAccountPickerModal";

interface Props {
  withdrawCurrency: "BOB" | "USD";
  onWithdrawCurrencyChange: (currency: "BOB" | "USD") => void;
  accountsForCurrency: BankAccount[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
  cryptoAddress: string;
  onCryptoAddressChange: (address: string) => void;
  withdrawAmount: string;
  onWithdrawAmountChange: (amount: string) => void;
  withdrawableBalance: number;
  totalBalanceUsd: number;
  withdrawalsEnabled: boolean;
  isLoading: boolean;
  onSubmit: () => void;
}

export default function WithdrawalFormTab({
  withdrawCurrency,
  onWithdrawCurrencyChange,
  accountsForCurrency,
  selectedAccountId,
  onSelectAccount,
  cryptoAddress,
  onCryptoAddressChange,
  withdrawAmount,
  onWithdrawAmountChange,
  withdrawableBalance,
  totalBalanceUsd,
  withdrawalsEnabled,
  isLoading,
  onSubmit,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const available = withdrawCurrency === "USD" ? totalBalanceUsd : withdrawableBalance;
  const isDisabled =
    !withdrawalsEnabled ||
    isLoading ||
    (withdrawCurrency === "BOB" && accountsForCurrency.length === 0);

  return (
    <View style={styles.container}>

      <WithdrawalTypeSelector
        value={withdrawCurrency}
        onChange={(c) => onWithdrawCurrencyChange(c)}
      />

      {withdrawCurrency === "BOB" ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Destino del pago</Text>
          {accountsForCurrency.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="business-outline" size={20} color={appTheme.colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyTitle}>Sin cuentas registradas</Text>
                <Text style={styles.emptyText}>Agrega una cuenta BOB en la sección Cuentas</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Botón seleccionar siempre arriba */}
              <Pressable style={styles.accountPickerBtn} onPress={() => setModalVisible(true)}>
                <View style={styles.accountPickerIcon}>
                  <Ionicons name="business" size={16} color={appTheme.colors.primary} />
                </View>
                <Text style={styles.accountPickerPlaceholder}>
                  {selectedAccountId ? "Cambiar cuenta" : "Seleccionar cuenta bancaria"}
                </Text>
                <View style={styles.accountPickerChevron}>
                  <Ionicons name="chevron-down" size={15} color={appTheme.colors.textMuted} />
                </View>
              </Pressable>

              {/* Mini tarjeta aparece solo si hay selección */}
              {selectedAccountId ? (() => {
                const acc = accountsForCurrency.find((a) => a.id === selectedAccountId);
                if (!acc) return null;
                return (
                  <LinearGradient
                    colors={["#1565C0", "#1976D2", "#2196F3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.miniCard}
                  >
                    <View style={styles.miniCardCircle1} />
                    <View style={styles.miniCardCircle2} />
                    <View style={styles.miniCardRow}>
                      <Ionicons name="card" size={16} color="rgba(255,255,255,0.9)" />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.miniCardNumber}>•••• •••• •••• {acc.accountNumber.slice(-4)}</Text>
                        <Text style={styles.miniCardBank} numberOfLines={1}>{acc.bankName}</Text>
                      </View>
                      {acc.currency ? (
                        <View style={styles.miniCardBadge}>
                          <Text style={styles.miniCardBadgeText}>{acc.currency}</Text>
                        </View>
                      ) : null}
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </View>
                    <View style={styles.miniCardDivider} />
                    <Text style={styles.miniCardHolder} numberOfLines={1}>{acc.accountHolderName || "—"}</Text>
                  </LinearGradient>
                );
              })() : null}

              <BankAccountPickerModal
                visible={modalVisible}
                accounts={accountsForCurrency}
                selectedId={selectedAccountId}
                onSelect={onSelectAccount}
                onClose={() => setModalVisible(false)}
              />
            </>
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Wallet de destino</Text>
          <View style={styles.cryptoBanner}>
            <View style={styles.cryptoBannerIcon}>
              <Ionicons name="logo-bitcoin" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.cryptoBannerText}>USDT · Red BEP20 · Binance</Text>
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="wallet-outline" size={16} color={appTheme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              value={cryptoAddress}
              onChangeText={onCryptoAddressChange}
              placeholder="0x742d35Cc6634C0532925..."
              placeholderTextColor={appTheme.colors.textMuted}
              style={styles.cryptoInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
      )}

      <WithdrawalAmountInput
        value={withdrawAmount}
        onChange={onWithdrawAmountChange}
        available={available}
        currency={withdrawCurrency}
      />

      <Pressable
        style={[styles.submitBtn, isDisabled && styles.submitBtnDisabled]}
        disabled={isDisabled}
        onPress={onSubmit}
      >
        {isLoading ? (
          <Text style={styles.submitBtnText}>Procesando...</Text>
        ) : (
          <>
            <Ionicons name="arrow-up-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>Confirmar retiro</Text>
          </>
        )}
      </Pressable>

      {!withdrawalsEnabled ? (
        <View style={styles.disabledBanner}>
          <Ionicons name="lock-closed-outline" size={14} color="#92400E" />
          <Text style={styles.disabledText}>Retiros temporalmente deshabilitados</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  section: { gap: 8 },
  sectionLabel: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    borderStyle: "dashed",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  emptyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  accountsWrap: { gap: 8 },
  accountPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  accountPickerIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  accountPickerPlaceholder: {
    flex: 1,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  accountPickerChevron: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  // Mini card
  miniCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    overflow: "hidden",
    shadowColor: "#1565C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  miniCardCircle1: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -30,
    right: -20,
  },
  miniCardCircle2: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: -10,
  },
  miniCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniCardNumber: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    letterSpacing: 2,
  },
  miniCardBank: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: appTheme.fonts.body,
    fontSize: 10,
    marginTop: 1,
  },
  miniCardBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  miniCardBadgeText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  miniCardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  miniCardHolder: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: appTheme.fonts.heading,
    fontSize: 12,
    fontWeight: "700",
  },
  cryptoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cryptoBannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  cryptoBannerText: {
    color: "#92400E",
    fontFamily: appTheme.fonts.heading,
    fontSize: 12,
    fontWeight: "700",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputIcon: { marginRight: 8 },
  cryptoInput: {
    flex: 1,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    paddingVertical: 10,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: appTheme.colors.primary,
    shadowColor: appTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  disabledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disabledText: {
    color: "#92400E",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
  },
});
