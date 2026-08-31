import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import AppChip from "../../../components/ui/AppChip";
import { appTheme } from "../../../theme/appTheme";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  specialties: string[];
  selectedSpecialty: string;
  onSpecialtyChange: (value: string) => void;
  resultLabel: string;
};

export default function ProfessionalsHeader({
  search,
  onSearchChange,
  specialties,
  selectedSpecialty,
  onSpecialtyChange,
  resultLabel,
}: Props) {
  return (
    <View className="gap-3 pb-3">
      <Text className="font-heading text-[30px] font-bold leading-9 text-[#020617]">
        Profesionales
      </Text>

      <View className="min-h-[52px] flex-row items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 px-4">
        <Ionicons name="search" size={18} color={appTheme.colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Buscar por nombre o especialidad"
          placeholderTextColor={appTheme.colors.textMuted}
          className="min-h-[48px] flex-1 font-body text-[15px] text-[#020617]"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => onSearchChange("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={appTheme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={specialties}
        keyExtractor={(item) => item}
        contentContainerStyle={{ gap: 8, paddingVertical: 6, paddingRight: 6 }}
        renderItem={({ item }) => (
          <AppChip
            label={item}
            active={selectedSpecialty === item}
            onPress={() => onSpecialtyChange(item)}
          />
        )}
      />

      <Text className="font-body text-[13px] font-medium text-slate-600">{resultLabel}</Text>
    </View>
  );
}
