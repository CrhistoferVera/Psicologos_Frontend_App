import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Package, Wallet } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { appTheme } from "../../../theme/appTheme";
import type { PackageData } from "../../../types/package";

const CARD_ACCENTS = ["#F59E0B", "#22C55E", "#2563EB"];

type Props = {
  item: PackageData;
  index: number;
  formattedPrice: string;
  onPress: () => void;
};

export function PackageCard({ item, index, formattedPrice, onPress }: Props) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Gradiente de brillo de fondo */}
      <LinearGradient
        colors={[`${accent}18`, "#FFFFFF", `${accent}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Barra de color izquierda */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.content}>
        {/* Top */}
        <View style={styles.top}>
          <View style={[styles.iconWrap, { backgroundColor: `${accent}20` }]}>
            <Package size={22} color={accent} />
          </View>
          <View style={styles.titleWrap}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={[styles.creditsBadge, { backgroundColor: `${accent}20` }]}>
              <Wallet size={11} color={accent} />
              <Text style={[styles.creditsText, { color: accent }]}>
                Se acredita directo a tu wallet
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom */}
        <View style={styles.bottom}>
          <View>
            <Text style={styles.priceLabel}>Recarga a tu wallet</Text>
            <Text style={styles.price}>{formattedPrice}</Text>
          </View>
          <LinearGradient
            colors={[accent, `${accent}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buyBtn}
          >
            <Text style={styles.buyBtnText}>Comprar</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  accentBar: {
    width: 5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: "#0F172A",
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
  },
  creditsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  creditsText: {
    fontFamily: appTheme.fonts.heading,
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceLabel: {
    color: "#6B7280",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    marginBottom: 2,
  },
  walletLabel: {
    color: "#6B7280",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    marginBottom: 2,
  },
  price: {
    color: "#0F172A",
    fontFamily: appTheme.fonts.heading,
    fontSize: 22,
    fontWeight: "700",
  },
  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 99,
  },
  buyBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },
});
