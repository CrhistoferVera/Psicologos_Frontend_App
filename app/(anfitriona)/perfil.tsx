import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from "react-native";
import AnfitrionaDashboard from "@/src/screens/user/anfitriona/AnfitrionaDashboard";

export default function AnfitrianaPerfil() {
  return (
      <View className="flex-1">
        <AnfitrionaDashboard />
      </View>
  );
}

//nota SafeAreaView agrega panding automaticamente en la parte inferior y superior
