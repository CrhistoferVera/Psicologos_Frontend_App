import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import AppChip from "../../../components/ui/AppChip";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getProfessionals, getSpecialtiesCatalog } from "../api/professionalsApi";
import ProfessionalCard from "../components/ProfessionalCard";
import type { Professional } from "../types";

export default function ProfessionalsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string | string[]; specialty?: string | string[] }>();

  const initialSearch = Array.isArray(params.search) ? params.search[0] : params.search ?? "";
  const initialSpecialty = Array.isArray(params.specialty) ? params.specialty[0] : params.specialty ?? "Todos";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [items, setItems] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const catalog = await getSpecialtiesCatalog();
        setSpecialties(["Todos", ...catalog]);
      } catch {
        // catalog failure is non-blocking
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getProfessionals({ specialty: selectedSpecialty });
        setItems(list);
      } catch {
        setError("No se pudo cargar el listado de profesionales.");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedSpecialty]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.specialties.some((tag) => tag.toLowerCase().includes(term)),
    );
  }, [items, search]);

  return (
    <AppScreen scroll contentPadding={16}>
      <View style={styles.container}>
        <Text style={styles.title}>Profesionales</Text>
        <Text style={styles.subtitle}>
          Filtra por especialidad y encuentra el perfil que necesitas.
        </Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={appTheme.colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o especialidad"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.search}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={specialties}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.specialtyList}
          renderItem={({ item }) => (
            <AppChip
              label={item}
              active={selectedSpecialty === item}
              onPress={() => setSelectedSpecialty(item)}
            />
          )}
        />

        <Text style={styles.resultText}>
          {loading ? "Cargando..." : `${filtered.length} resultados`}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <ProfessionalCard
              professional={item}
              onPress={() =>
                router.push({
                  pathname: "/(user)/professionals/[id]",
                  params: { id: item.id },
                } as any)
              }
            />
          )}
        />

        {!loading && filtered.length === 0 ? (
          <Text style={styles.emptyText}>
            No encontramos profesionales con esos filtros.
          </Text>
        ) : null}
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
    fontSize: 30,
    lineHeight: 34,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
  },

  subtitle: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: appTheme.fonts.body,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "#F8FAFC",
  },

  search: {
    flex: 1,
    minHeight: 48,
    color: appTheme.colors.text,
    fontSize: 15,
    fontFamily: appTheme.fonts.body,
  },

  specialtyList: {
    gap: 8,
    paddingVertical: 6,
    paddingRight: 6,
  },

  resultText: {
    color: "#475569",
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "500",
  },

  errorText: {
    color: appTheme.colors.danger,
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
  },

  emptyText: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    textAlign: "center",
    marginTop: 8,
  },
});

