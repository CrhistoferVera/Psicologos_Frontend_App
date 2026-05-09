import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { apiGetMyBalance } from "../../../api/wallet";
import { useUserRegion } from "../../../hooks/useUserRegion";
import { appTheme } from "../../../theme/appTheme";

type Balance = {
  balance: number;
  balanceUsd: number;
  promotionalBalance: number;
};

export function WalletBalanceBanner() {
  const { isBolivian } = useUserRegion();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetMyBalance()
      .then(setBalance)
      .catch(() => setBalance(null))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      apiGetMyBalance()
        .then(setBalance)
        .catch(() => setBalance(null))
        .finally(() => setLoading(false));
    }, []),
  );

  const displayBalance = isBolivian
    ? `Bs ${(balance?.balance ?? 0).toFixed(2)}`
    : `$${(balance?.balanceUsd ?? 0).toFixed(2)}`;

  const currency = isBolivian ? "BOB" : "USD";

  return (
    <LinearGradient
      colors={["#1E40AF", "#3B82F6", "#60A5FA"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      {/* Círculos decorativos de fondo */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      {/* Fila superior */}
      <View style={styles.topRow}>
        <View style={styles.walletIconWrap}>
          <Ionicons name="wallet" size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.walletLabel}>Mi Billetera</Text>
        <View style={styles.currencyBadge}>
          <Text style={styles.currencyText}>{currency}</Text>
        </View>
      </View>

      {/* Saldo principal */}
      <View style={styles.balanceRow}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.balanceAmount}>{displayBalance}</Text>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    overflow: "hidden",
    shadowColor: "#1E40AF",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  circleTopRight: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -40,
    right: -30,
  },
  circleBottomLeft: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletLabel: {
    flex: 1,
    color: "rgba(255,255,255,0.85)",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },
  currencyBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  currencyText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 11,
    fontWeight: "700",
  },
  balanceRow: {
    gap: 4,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
});
