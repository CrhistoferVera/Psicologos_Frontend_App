import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import ProfessionalCard from "../components/ProfessionalCard";
import ProfessionalCardSkeleton from "../components/ProfessionalCardSkeleton";
import ProfessionalsEmptyState from "../components/ProfessionalsEmptyState";
import ProfessionalsHeader from "../components/ProfessionalsHeader";
import { useProfessionalsFeed } from "../hooks/useProfessionalsFeed";

const SKELETON_KEYS = ["s1", "s2", "s3", "s4"];

export default function ProfessionalsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string | string[]; specialty?: string | string[] }>();

  const initialSearch = Array.isArray(params.search) ? params.search[0] : params.search ?? "";
  const initialSpecialty = Array.isArray(params.specialty)
    ? params.specialty[0]
    : params.specialty ?? "Todos";

  const {
    search,
    setSearch,
    selectedSpecialty,
    setSelectedSpecialty,
    specialties,
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    loadMore,
    refresh,
  } = useProfessionalsFeed({ initialSearch, initialSpecialty });

  const hasFilters = search.trim().length > 0 || selectedSpecialty !== "Todos";

  function clearFilters() {
    setSearch("");
    setSelectedSpecialty("Todos");
  }

  const header = (
    <>
      <ProfessionalsHeader
        search={search}
        onSearchChange={setSearch}
        specialties={specialties}
        selectedSpecialty={selectedSpecialty}
        onSpecialtyChange={setSelectedSpecialty}
        resultLabel={loading ? "Buscando..." : `${items.length} resultados`}
      />
      {error ? (
        <Text className="pb-2 font-body text-xs text-[#DC2626]">{error}</Text>
      ) : null}
      {loading ? (
        <View className="gap-3">
          {SKELETON_KEYS.map((key) => (
            <ProfessionalCardSkeleton key={key} />
          ))}
        </View>
      ) : null}
    </>
  );

  return (
    <AppScreen>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View className="h-3" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={appTheme.colors.primary}
          />
        }
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
        ListEmptyComponent={
          loading ? null : (
            <ProfessionalsEmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4">
              <ActivityIndicator color={appTheme.colors.primary} />
            </View>
          ) : null
        }
      />
    </AppScreen>
  );
}
