import { Dimensions, Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { Story } from "./StoryItem";

const { width: W, height: H } = Dimensions.get("window");

type Props = {
  story: Story | null;
  onClose: () => void;
};

export default function StoryModal({ story, onClose }: Props) {
  return (
    <Modal
      visible={!!story}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}
        activeOpacity={1}
        onPress={onClose}
      >
        {story && (
          <View style={{ alignItems: "center" }}>

            <View style={{ flexDirection: "row", gap: 4, marginBottom: 12, width: W * 0.88 }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1, height: 2, borderRadius: 1,
                    backgroundColor: i === 0 ? "white" : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </View>

            <Image
              source={{ uri: story.avatar.replace("200/200", "500/800") }}
              style={{ width: W * 0.88, height: H * 0.72, borderRadius: 16 }}
              resizeMode="cover"
            />


            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14, gap: 10 }}>
              <Image
                source={{ uri: story.avatar }}
                style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#ec4899" }}
              />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                {story.name}
              </Text>
            </View>

            <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
              Toca para cerrar
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Modal>
  );
}
