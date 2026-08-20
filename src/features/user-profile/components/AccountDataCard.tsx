import { Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";

type Props = {
  email: string;
  phone: string;
  loading: boolean;
  isProfileComplete: boolean;
};

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2 gap-2">
      <Text className="flex-1 text-[#475569] font-body text-sm">{label}</Text>
      <Text
        className="flex-[1.4] text-right text-[#020617] font-body text-sm font-semibold"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export default function AccountDataCard({ email, phone, loading, isProfileComplete }: Props) {
  const profileStatus = loading ? "Sincronizando..." : isProfileComplete ? "Completo" : "Pendiente";

  return (
    <AppCard>
      <Text className="text-[#020617] font-heading text-lg font-bold mb-0.5">Datos de cuenta</Text>
      <DataRow label="Correo" value={email} />
      <DataRow label="Estado del perfil" value={profileStatus} />
    </AppCard>
  );
}
