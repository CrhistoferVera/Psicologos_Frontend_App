import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import ProfessionalFeedCard from "../../../user-home/components/ProfessionalFeedCard";

type Props = {
  visible: boolean;
  onClose: () => void;
  id: string;
  displayName: string;
  username?: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string;
  specialties: string[];
  isOnline: boolean;
  languages: string[];
  isVerified?: boolean;
};

export default function PublicViewModal({
  visible,
  onClose,
  id,
  displayName,
  username,
  avatarUrl,
  coverUrl,
  bio,
  specialties,
  isOnline,
  languages,
  isVerified,
}: Props) {
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <View className="flex-row items-center justify-between px-4 py-3 bg-[#0a0f1a]">
          <Text className="text-white font-heading text-base font-bold">Vista pública en el feed</Text>
          <Pressable
            className="w-8 h-8 rounded-full bg-white/15 items-center justify-center active:bg-white/25"
            accessibilityRole="button"
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <ProfessionalFeedCard
          professional={{
            id,
            name: displayName,
            username: username || undefined,
            avatar: avatarUrl ?? "",
            coverImage: coverUrl ?? undefined,
            bio,
            specialties,
            isOnline,
            prices: {},
            languages,
            isVerified,
          }}
          cardHeight={height * 0.78}
          onProfilePress={() => {}}
          onChatPress={() => {}}
        />

        <View className="py-2.5 items-center bg-[#0a0f1a]">
          <Text className="text-white/45 font-body text-xs">Así te ven los clientes en el feed</Text>
        </View>
      </View>
    </Modal>
  );
}
