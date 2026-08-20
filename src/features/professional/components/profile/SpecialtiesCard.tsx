import { Pressable, Text, View } from "react-native";
import AppChip from "../../../../components/ui/AppChip";
import SectionCard from "./SectionCard";

type Item = { id: string; name: string };

type Props = {
  editing: boolean;
  onToggleEdit: () => void;
  catalog: Item[];
  readonlySpecialties: Item[];
  selectedSpecialties: string[];
  onToggleSpecialty: (id: string) => void;
};

export default function SpecialtiesCard({
  editing,
  onToggleEdit,
  catalog,
  readonlySpecialties,
  selectedSpecialties,
  onToggleSpecialty,
}: Props) {
  const items = editing ? catalog : readonlySpecialties;

  return (
    <SectionCard
      title="Especialidades"
      action={
        <Pressable hitSlop={6} onPress={onToggleEdit}>
          <Text className="text-[#5B9BD5] font-body text-[13px] font-semibold">
            {editing ? "Listo" : "Editar"}
          </Text>
        </Pressable>
      }
    >
      <View className="flex-row flex-wrap gap-2">
        {items.map((item) => (
          <AppChip
            key={item.id}
            label={item.name}
            active={selectedSpecialties.includes(item.id)}
            onPress={editing ? () => onToggleSpecialty(item.id) : undefined}
          />
        ))}
      </View>
    </SectionCard>
  );
}
