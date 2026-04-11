import type { TrustItem } from "@/src/types/anfitrionaProfile";
import { Text, View } from "react-native";

type Props = {
  items: TrustItem[];
};

export default function TrustSection({ items }: Props) {
  return (
    <View
      style={{
        marginTop: 16,
        marginHorizontal: 16,
        backgroundColor: "#1a1a1a",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#2a2a2a",
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 15,
          fontWeight: "700",
          marginBottom: 16,
        }}
      >
        ⭐ POR QUÉ CONFIAR EN MÍ
      </Text>

      {items.map((item, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: index < items.length - 1 ? 16 : 0,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "#2a1a1a",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
              {item.label}
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
              {item.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
