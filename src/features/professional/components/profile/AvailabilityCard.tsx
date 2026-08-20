import { Pressable, Switch, Text, View } from "react-native";
import SectionCard from "./SectionCard";

type Props = {
  isOnline: boolean;
  onToggleOnline: (value: boolean) => void;
  onSessions: () => void;
  onAvailability: () => void;
};

function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      className="self-start rounded-[10px] border border-[#5B9BD5] px-3 py-[7px] bg-white active:bg-[#EAF2FB]"
      accessibilityRole="button"
      onPress={onPress}
    >
      <Text className="text-[#5B9BD5] font-body text-[13px] font-bold">{label}</Text>
    </Pressable>
  );
}

export default function AvailabilityCard({
  isOnline,
  onToggleOnline,
  onSessions,
  onAvailability,
}: Props) {
  return (
    <SectionCard title="Estado de disponibilidad">
      <View className="mt-1 flex-row justify-between items-center">
        <Text className="flex-1 text-[#394F67] font-body text-sm font-semibold">
          Mostrarme como disponible para clientes
        </Text>
        <Switch
          value={isOnline}
          onValueChange={onToggleOnline}
          trackColor={{ false: "#CFD8E5", true: "#A7D6BB" }}
          thumbColor="#FFFFFF"
        />
      </View>
      <Text className="text-[#5F7896] font-body text-sm leading-[22px]">
        {isOnline ? "Disponible" : "No disponible"}
      </Text>

      <View className="h-px bg-[#ECF1F7]" />

      <Text className="text-[#5F7896] font-body text-sm leading-[22px]">
        Gestiona tus sesiones en Mis sesiones.
      </Text>
      <LinkButton label="Ir a Mis sesiones" onPress={onSessions} />

      <Text className="text-[#5F7896] font-body text-sm leading-[22px]">
        Gestiona tus horarios en Disponibilidad.
      </Text>
      <LinkButton label="Ir a Disponibilidad" onPress={onAvailability} />
    </SectionCard>
  );
}
