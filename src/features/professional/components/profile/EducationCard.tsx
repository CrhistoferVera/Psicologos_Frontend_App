import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import type { EducationEntry } from "../../types";
import SectionCard from "./SectionCard";

type Props = {
  education: EducationEntry[];
  onAdd: () => void;
  onEdit: (entry: EducationEntry) => void;
  onDelete: (id: string) => void;
};

export default function EducationCard({ education, onAdd, onEdit, onDelete }: Props) {
  return (
    <SectionCard
      title="Formación académica"
      action={
        <Pressable hitSlop={6} onPress={onAdd}>
          <Text className="text-[#5B9BD5] font-body text-[13px] font-semibold">+ Agregar</Text>
        </Pressable>
      }
    >
      {education.length === 0 ? (
        <Text className="text-[#5F7896] font-body text-sm leading-[22px]">
          Agrega tu formación académica para que los clientes conozcan tus credenciales.
        </Text>
      ) : (
        <View className="gap-2.5">
          {education.map((entry) => (
            <View
              key={entry.id}
              className="flex-row items-start gap-2 py-2 border-b border-[#EEF3FA]"
            >
              <View className="flex-1">
                <Text className="text-[#2A405B] font-body text-sm font-bold leading-5">
                  {entry.degree}
                </Text>
                <Text className="text-[#5F7896] font-body text-xs mt-0.5">
                  {entry.institution} · {entry.year}
                </Text>
                {entry.description ? (
                  <Text className="text-[#8EA5BE] font-body text-xs mt-0.5 leading-[17px]">
                    {entry.description}
                  </Text>
                ) : null}
                {entry.photoUrl ? (
                  <Image
                    source={{ uri: entry.photoUrl }}
                    className="w-full h-20 rounded-[10px] mt-1.5"
                    resizeMode="cover"
                  />
                ) : null}
              </View>

              <View className="flex-row gap-1.5">
                <Pressable
                  className="w-[30px] h-[30px] rounded-lg bg-[#EDF4FB] items-center justify-center active:opacity-70"
                  accessibilityRole="button"
                  onPress={() => onEdit(entry)}
                >
                  <Ionicons name="create-outline" size={15} color="#4F7BAE" />
                </Pressable>
                <Pressable
                  className="w-[30px] h-[30px] rounded-lg bg-[#FEF2F2] items-center justify-center active:opacity-70"
                  accessibilityRole="button"
                  onPress={() => onDelete(entry.id)}
                >
                  <Ionicons name="trash-outline" size={15} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}
