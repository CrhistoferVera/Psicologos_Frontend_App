import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";

type Props = {
  credits: number;
};

export default function ClienteCreditsHeaderTitle({ credits }: Props) {
  return (
    <View className="flex-row items-center pr-2">
      <Image
        source={require("../../../../assets/BlackandWhiteXLetterDigital.jpg")}
        className="w-[58px] h-[58px] mr-2"
        resizeMode="contain"
      />

      <View className="flex-row items-center">
        <Ionicons name="flash" size={18} color="#facc15" style={{ marginRight: 6 }} />
        <Text className="text-white text-[20px] font-bold">{credits} creditos</Text>
      </View>
    </View>
  );
}
