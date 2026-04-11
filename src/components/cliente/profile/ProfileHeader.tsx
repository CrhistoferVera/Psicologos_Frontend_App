import { useState } from "react";
import {
  Image,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import ProfileStatsBar from "./ProfileStatsBar";

type Props = {
  name: string;
  avatar: string;
  coverImage: string;
  isOnline: boolean;
  likesCount: number;
  rateCredits: number | null;
};

const COVER_HEIGHT = 260;
const AVATAR_SIZE = 90;
const AVATAR_LEFT = 20;

export default function ProfileHeader({ name, avatar, coverImage, isOnline, likesCount, rateCredits }: Props) {
  const { width, height } = useWindowDimensions();
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  return (
    <View style={{ paddingBottom: AVATAR_SIZE / 5 }}>
    
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => coverImage && setViewingImage(coverImage)}
        style={{ width, height: COVER_HEIGHT, backgroundColor: "#1a1a1a" }}
      >
        <Image
          source={coverImage ? { uri: coverImage } : require("../../../../assets/no_image.jpg")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <Modal visible={!!viewingImage} transparent animationType="fade" statusBarTranslucent>
        <StatusBar hidden />
        <TouchableWithoutFeedback onPress={() => setViewingImage(null)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" }}>
            {viewingImage && (
              <Image
                source={{ uri: viewingImage }}
                style={{ width, height: height * 0.85 }}
                resizeMode="contain"
              />
            )}
            <Text style={{ color: "rgba(255,255,255,0.4)", marginTop: 16, fontSize: 13 }}>
              Toca para cerrar
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    
      <View
        style={{
          marginTop: -(AVATAR_SIZE / 2),
          paddingHorizontal: AVATAR_LEFT,
        }}
      >
        <View
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            borderWidth: 3,
            borderColor: "#ec4899",
            backgroundColor: "#7c3aed",
            overflow: "hidden",
          }}
        >
          <Image
            source={avatar ? { uri: avatar } : require("../../../../assets/no_image.jpg")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>

    
        <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginTop: 10 }}>
          {name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 }}>
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: isOnline ? "#22c55e" : "#6b7280",
            }}
          />
          <Text style={{ color: isOnline ? "#22c55e" : "#6b7280", fontSize: 13 }}>
            {isOnline ? "En línea" : "Desconectada"}
          </Text>
        </View>

        <ProfileStatsBar likesCount={likesCount} rateCredits={rateCredits} />
      </View>
    </View>
  );
}
