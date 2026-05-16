import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";

interface Props {
  value: "BOB" | "USD";
  onChange: (currency: "BOB" | "USD") => void;
}

const OPTIONS = [
  {
    key: "BOB" as const,
    label: "Bolivianos",
    sublabel: "Bs",
    icon: "business-outline" as const,
    activeColor: "#3E7F61",
    activeBg: "#F0FDF4",
    activeBorder: "#86EFAC",
  },
  {
    key: "USD" as const,
    label: "Dólares",
    sublabel: "USD · Binance",
    icon: "logo-bitcoin" as const,
    activeColor: "#1E4D7B",
    activeBg: "#EFF6FF",
    activeBorder: "#93C5FD",
  },
];

export default function WithdrawalTypeSelector({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const isActive = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            style={[
              styles.option,
              isActive && {
                backgroundColor: opt.activeBg,
                borderColor: opt.activeBorder,
              },
            ]}
            onPress={() => onChange(opt.key)}
          >
            <View style={[styles.iconWrap, isActive && { backgroundColor: opt.activeColor }]}>
              <Ionicons name={opt.icon} size={18} color="#FFFFFF" />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.label, isActive && { color: opt.activeColor }]}>
                {opt.label}
              </Text>
              <Text style={styles.sublabel}>{opt.sublabel}</Text>
            </View>
            {isActive ? (
              <View style={[styles.checkDot, { backgroundColor: opt.activeColor }]}>
                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.emptyDot} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  label: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 13,
    fontWeight: "700",
  },
  sublabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    marginTop: 1,
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
  },
});
