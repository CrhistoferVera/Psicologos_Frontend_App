import { Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import PromoAccessCard from "@/src/components/auth/choose-access/PromoAccessCard";
import SecondaryAccessLinks from "@/src/components/auth/choose-access/SecondaryAccessLinks";

export default function ChooseAccess() {
  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 px-6 pt-2 pb-6">
        <View className="flex-1 mt-6">
          <Text className="text-white text-5xl text-center font-bold">
            Bienvenido
          </Text>
          <Text className="text-white text-3xl font-bold mt-6">
            Amigas disponibles {'\n'} ahora 🔥
          </Text>
          <Text className="text-white/65 text-2xl mt-4">
            Entra y empieza a chatear en segundos
          </Text>

          <PromoAccessCard
            onPrimaryPress={() => router.push("/(auth)/login-client")}
          />
        </View>

        <SecondaryAccessLinks
          onHostessPress={() => router.push("/(auth)/login-hostess")}
          onAdminPress={() => router.push("/(auth)/login-admin")}
        />
      </SafeAreaView>
    </View>
  );
}
