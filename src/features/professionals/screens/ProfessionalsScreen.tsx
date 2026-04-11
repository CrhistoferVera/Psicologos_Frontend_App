import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import AppChip from "../../../components/ui/AppChip";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getProfessionals, getSpecialtiesCatalog } from "../api/professionalsApi";
import ProfessionalCard from "../components/ProfessionalCard";
import type { Professional } from "../types";

export default function ProfessionalsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string; specialty?: string }>();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.search ?? "");
  const [selectedSpecialty, setSelectedSpecialty] = useState(params.specialty ?? "Todos");
  const [items, setItems] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [list, catalog] = await Promise.all([getProfessionals(params.search), getSpecialtiesCatalog()]);
      setItems(list);
      setSpecialties(["Todos", ...catalog]);
      setLoading(false);
    })();
  }, [params.search]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const textMatch =
        search.trim().length === 0 ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.specialties.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const specialtyMatch =
        selectedSpecialty === "Todos" ||
        item.specialties.some((tag) => tag.toLowerCase() === selectedSpecialty.toLowerCase());
      return textMatch && specialtyMatch;
    });
  }, [items, search, selectedSpecialty]);

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>Profesionales</Text>
        <Text style={styles.subtitle}>Filtra por especialidad y encuentra el perfil que necesitas.</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o especialidad"
          placeholderTextColor={appTheme.colors.textMuted}
          style={styles.search}
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={specialties}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.specialtyList}
          renderItem={({ item }) => (
            <AppChip label={item} active={selectedSpecialty === item} onPress={() => setSelectedSpecialty(item)} />
          )}
        />

        <Text style={styles.resultText}>{loading ? "Cargando..." : `${filtered.length} resultados`}</Text>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <ProfessionalCard
              professional={item}
              onPress={() => router.push({ pathname: "/(user)/professionals/[id]", params: { id: item.id } } as any)}
            />
          )}
          scrollEnabled={false}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 28,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: appTheme.fonts.body,
  },
  search: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    borderColor: appTheme.colors.border,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
  },
  specialtyList: {
    gap: 8,
    paddingVertical: 6,
  },
  resultText: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
  },
});

