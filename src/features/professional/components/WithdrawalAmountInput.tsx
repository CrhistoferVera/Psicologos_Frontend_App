import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";
import { formatBob, formatUsd } from "../../../utils/money";

interface Props {
  value: string;
  onChange: (v: string) => void;
  available: number;
  currency: "BOB" | "USD";
}

export default function WithdrawalAmountInput({ value, onChange, available, currency }: Props) {
  const formattedAvailable = currency === "USD" ? formatUsd(available) : formatBob(available);
  const numericValue = Number(value);
  const isOverLimit = Number.isFinite(numericValue) && numericValue > available && numericValue > 0;

  function handleMax() {
    onChange(available.toFixed(2));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Monto a transferir</Text>
        <Pressable style={styles.maxBtn} onPress={handleMax}>
          <Text style={styles.maxBtnText}>Máx</Text>
        </Pressable>
      </View>

      <View style={[styles.inputWrap, isOverLimit && styles.inputWrapError]}>
        <Text style={styles.currencySymbol}>{currency === "USD" ? "$" : "Bs"}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0.00"
          placeholderTextColor={appTheme.colors.textMuted}
          style={styles.input}
        />
      </View>

      <View style={styles.balanceRow}>
        <View style={[styles.balanceDot, isOverLimit && styles.balanceDotError]} />
        <Text style={[styles.balanceText, isOverLimit && styles.balanceTextError]}>
          {isOverLimit ? "Saldo insuficiente · " : "Disponible · "}
          <Text style={styles.balanceAmount}>{formattedAvailable}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },
  maxBtn: {
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  maxBtnText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 11,
    fontWeight: "700",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputWrapError: {
    borderColor: appTheme.colors.danger,
    backgroundColor: "#FFF5F5",
  },
  currencySymbol: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 24,
    fontWeight: "700",
    paddingVertical: 10,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  balanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: appTheme.colors.success,
  },
  balanceDotError: {
    backgroundColor: appTheme.colors.danger,
  },
  balanceText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  balanceTextError: {
    color: appTheme.colors.danger,
  },
  balanceAmount: {
    fontWeight: "700",
    color: appTheme.colors.text,
  },
});
