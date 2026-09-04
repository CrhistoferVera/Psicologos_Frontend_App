import { Text, View } from "react-native";
import AppChip from "../../../../components/ui/AppChip";
import type { SpecialtiesStepData } from "./stepProps";

export default function StepSpecialties({ reg }: { reg: SpecialtiesStepData }) {
  return (
    <View className="gap-3">
      <Text className="text-[#020617] font-heading text-lg font-bold">Especialidades</Text>
      <Text className="text-[#475569] font-body text-[13px]">Selecciona tus principales áreas de atención.</Text>
      {reg.catalogLoading ? (
        <Text className="text-[#475569] font-body text-xs leading-[18px]">Cargando especialidades...</Text>
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        {reg.specialtiesCatalog.map((tag) => (
          <AppChip
            key={tag.id}
            label={tag.name}
            active={reg.selectedSpecialties.includes(tag.id)}
            onPress={() => reg.toggleSpecialty(tag.id)}
          />
        ))}
      </View>
    </View>
  );
}
