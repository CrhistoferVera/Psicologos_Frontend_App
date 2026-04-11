import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

type Props = {
  accepted: boolean;
  onToggle: () => void;
};

export default function TermsCheckbox({ accepted, onToggle }: Props) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginVertical: 12 }}>
      <Pressable onPress={onToggle} style={{ marginTop: 3, marginRight: 12 }}>
        <View
          style={{
            width: 20, height: 20, borderRadius: 4,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.6)",
            alignItems: "center", justifyContent: "center",
            backgroundColor: accepted ? "white" : "transparent",
          }}
        >
          {accepted && <View style={{ width: 12, height: 12, backgroundColor: "black", borderRadius: 2 }} />}
        </View>
      </Pressable>

      <Pressable onPress={onToggle} style={{ flex: 1 }}>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 18 }}>
          He leido y acepto los{" "}
          <Text
            style={{ color: "#f87171", textDecorationLine: "underline" }}
            onPress={() => router.push("/(anfitriona)/terminos")}
          >
            Términos y Condiciones
          </Text>
          {" "}de uso.
        </Text>
      </Pressable>
    </View>
  );
}
