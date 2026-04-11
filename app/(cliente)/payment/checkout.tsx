import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import { View, Text } from "react-native";
import ConfirmarPagoScreen from '@/src/screens/user/client/ConfirmarPagosScreen';

export default function Checkout() {
    return (
        <View className="flex-1">
            <ScreenHeader title="Checkout" role="cliente" />
            <ConfirmarPagoScreen />
        </View>
    );
}

//nota SafeAreaView agrega panding automaticamente en la parte inferior y superior

