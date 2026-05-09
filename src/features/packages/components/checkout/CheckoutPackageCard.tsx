import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Package } from "lucide-react-native";
import { appTheme } from "../../../../theme/appTheme";

type Props = {
  name: string;
  credits: string;
  displayPrice: string;
};

export function CheckoutPackageCard({ name, credits, displayPrice }: Props) {
  return (
    <LinearGradient
      colors={["#1E40AF", "#3B82F6", "#60A5FA"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Package size={26} color="#3B82F6" />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.credits}>{Number(credits).toLocaleString()} créditos</Text>
        </View>
        <Text style={styles.price}>{displayPrice}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
    shadowColor: "#1E40AF",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  circle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -50,
    right: -40,
  },
  circle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
  },
  credits: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  price: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 24,
    fontWeight: "700",
  },
});
