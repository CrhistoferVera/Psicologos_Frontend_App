import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import { View, Text } from "react-native";
import CreditosScreen from  '@/src/screens/user/client/CreditosScreen';

export default function ClienteCreditos() {
  return (
      <View className="flex-1">
        <ScreenHeader title="Mis Creditos" role="cliente"/>
        <CreditosScreen />
      </View>
  );
}

//nota SafeAreaView agrega panding automaticamente en la parte inferior y superior

