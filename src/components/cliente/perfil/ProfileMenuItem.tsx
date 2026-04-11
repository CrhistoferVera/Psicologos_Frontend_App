import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  label: string;
  onPress: () => void;
  isLast?: boolean;
};

export default function ProfileMenuItem({ label, onPress, isLast }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, !isLast && styles.rowBorder]}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.arrow}>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#F6C16A" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 17,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(246,193,106,0.12)",
  },
  label: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
  arrow: {
    opacity: 0.9,
  },
});
