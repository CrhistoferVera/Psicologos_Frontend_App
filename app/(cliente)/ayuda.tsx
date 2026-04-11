import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ScreenHeader from "@/src/components/Menu/ScreenHeader";

export default function Ayuda() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <ScreenHeader title="Ayuda" role="cliente" showBackButton />

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <MaterialCommunityIcons name="help-circle-outline" size={48} color="#3f3f46" style={{ marginBottom: 16 }} />
        <Text style={{ color: "#9ca3af", fontSize: 16, textAlign: "center" }}>
          Centro de ayuda próximamente
        </Text>
      </View>
    </View>
  );
}
