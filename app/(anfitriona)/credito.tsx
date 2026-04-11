import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import { View, Text } from "react-native";

export default function AnfitrianaCredito() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <ScreenHeader title="Crédito" role="anfitriona"/>
      <Text className="text-2xl font-bold text-gray-800">Crédito</Text>
      <Text className="text-base text-gray-500 mt-2">
        Tu saldo y créditos
      </Text>
    </View>
  );
}
