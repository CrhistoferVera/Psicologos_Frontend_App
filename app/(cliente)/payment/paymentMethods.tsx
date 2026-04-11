import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import { View, Text } from "react-native";
import MetodosPagosScreen from '@/src/screens/user/client/MetodosPagoScreen';

export default function PaymentMethods() {
    return (
        <View className="flex-1">
            <ScreenHeader title="Metodos de pago" role="cliente" />
            <MetodosPagosScreen />
        </View>
    );
}

//nota SafeAreaView agrega panding automaticamente en la parte inferior y superior

