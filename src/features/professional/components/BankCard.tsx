import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import type { BankAccount } from "../../../api/wallet";

interface Props {
  account: BankAccount;
  isSelected?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  selectionMode?: boolean;
  isChecked?: boolean;
}

export default function BankCard({ account, isSelected = false, onPress, onDelete, isDeleting, selectionMode = false, isChecked = false }: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const borderOpacity = shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1, 0.2] });
  const borderGlow = shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["rgba(100,181,246,0.2)", "rgba(255,255,255,0.85)", "rgba(100,181,246,0.2)"] });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardWrapper, pressed && { opacity: 0.88 }]}
    >
      <Animated.View style={[styles.cardBorderGlow, { opacity: borderOpacity, borderColor: borderGlow }]} />
      <LinearGradient
        colors={isSelected ? ["#1565C0", "#1E88E5", "#42A5F5"] : ["#1976D2", "#2196F3", "#64B5F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />

        <View style={styles.cardTop}>
          <Ionicons name="card" size={20} color="rgba(255,255,255,0.9)" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardNumber}>•••• •••• •••• {account.accountNumber.slice(-4)}</Text>
            <Text style={styles.cardBankName} numberOfLines={1}>{account.bankName}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBottom}>
          <Text style={styles.cardHolder} numberOfLines={1}>{account.accountHolderName || "—"}</Text>
          <View style={styles.cardBottomRight}>
            {selectionMode ? (
              <View style={[styles.selectionCircle, isChecked && styles.selectionCircleChecked]}>
                {isChecked && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
            ) : null}
            {!selectionMode && account.currency ? (
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyText}>{account.currency}</Text>
              </View>
            ) : null}
            {!selectionMode && isSelected && <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />}
            {!selectionMode && onDelete ? (
              <Pressable
                onPress={onDelete}
                disabled={isDeleting}
                style={styles.deleteBtn}
              >
                <Ionicons name={isDeleting ? "hourglass-outline" : "trash-outline"} size={14} color="rgba(255,255,255,0.85)" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 16,
    shadowColor: "#1565C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cardBorderGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    zIndex: 10,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: "hidden",
    gap: 8,
  },
  circleTopRight: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -30,
    right: -30,
  },
  circleBottomLeft: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: -15,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardNumber: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    letterSpacing: 2,
  },
  cardBankName: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHolder: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  cardBottomRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  currencyText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionCircleChecked: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
});
