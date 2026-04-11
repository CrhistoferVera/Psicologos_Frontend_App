import { ImageBackground, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type BadgeTone = "green" | "red" | "yellow";

type HostessPreviewItemProps = {
  imageUri: string;
  badgeText: string;
  badgeTone: BadgeTone;
  nameAge: string;
};

const badgeStyles: Record<BadgeTone, { bg: string; text: string }> = {
  green: { bg: "#4ade80", text: "#14532d" },
  red: { bg: "#ef4444", text: "#7f1d1d" },
  yellow: { bg: "#f59e0b", text: "#78350f" },
};

export default function HostessPreviewItem({
  imageUri,
  badgeText,
  badgeTone,
  nameAge,
}: HostessPreviewItemProps) {
  const badge = badgeStyles[badgeTone];

  return (
    <View className="flex-1">
      <ImageBackground
        source={{ uri: imageUri }}
        resizeMode="cover"
        style={{ height: 270 }}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.78)"]}
          style={{ flex: 1, justifyContent: "flex-end", padding: 10 }}
        >
          <View>
            <View style={{ alignSelf: "flex-start", marginBottom: 8 }}>
              <Text
                style={{
                  backgroundColor: badge.bg,
                  color: badge.text,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  fontWeight: "700",
                  fontSize: 11,
                }}
              >
                {badgeText}
              </Text>
            </View>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
              {nameAge}
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
