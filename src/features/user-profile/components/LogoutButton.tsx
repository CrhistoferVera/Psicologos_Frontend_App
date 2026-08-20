import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

type Props = {
  onPress: () => void;
};

export default function LogoutButton({ onPress }: Props) {
  return (
    <Pressable
      className="min-h-[50px] rounded-[14px] border border-[#F5CACA] bg-[#FFF4F4] flex-row items-center justify-center gap-2 active:bg-[#FDE8E8] active:border-[#EBB4B4]"
      accessibilityRole="button"
      onPress={onPress}
    >
      <Ionicons name="log-out-outline" size={18} color="#DC2626" />
      <Text className="text-[#DC2626] font-body text-[15px] font-bold">Cerrar sesión</Text>
    </Pressable>
  );
}
