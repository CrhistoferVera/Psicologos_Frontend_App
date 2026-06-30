import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";

type Props = {
  debtBob: number;
  debtUsd: number;
};

export function DebtWarningBanner({ debtBob, debtUsd }: Props) {
  const router = useRouter();

  const debtSummary = [
    debtBob > 0 && `${debtBob.toFixed(2)} BOB`,
    debtUsd > 0 && `${debtUsd.toFixed(2)} USD`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      style={styles.banner}
      onPress={() => router.push("/(professional)/debt-payment" as any)}
    >
      <View style={styles.bannerLeft}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={16} color="#DC2626" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Cuenta bloqueada</Text>
          <Text style={styles.bannerSub}>Deuda: {debtSummary} · Toca para pagar</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#DC2626" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
    fontFamily: appTheme.fonts.heading,
  },
  bannerSub: {
    fontSize: 12,
    color: "#B91C1C",
    marginTop: 1,
  },
});
