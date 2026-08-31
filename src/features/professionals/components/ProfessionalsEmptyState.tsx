import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type Props = {
  hasFilters: boolean;
  onClearFilters: () => void;
};

export default function ProfessionalsEmptyState({ hasFilters, onClearFilters }: Props) {
  return (
    <View className="items-center gap-3 px-6 py-12">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Ionicons name="search-outline" size={28} color="#94A3B8" />
      </View>

      <Text className="font-heading text-base font-bold text-[#020617]">
        No encontramos profesionales
      </Text>
      <Text className="text-center font-body text-xs leading-[18px] text-slate-500">
        {hasFilters
          ? "Prueba con otra especialidad o cambia los términos de búsqueda."
          : "Aún no hay profesionales disponibles. Vuelve a intentarlo más tarde."}
      </Text>

      {hasFilters ? (
        <Pressable
          onPress={onClearFilters}
          android_ripple={{ color: "#E2E8F0" }}
          className="mt-1 rounded-full border border-slate-300 bg-white px-4 py-2 active:opacity-80"
        >
          <Text className="font-body text-xs font-bold text-[#020617]">Limpiar filtros</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
