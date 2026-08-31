import { useCallback, useEffect, useRef, useState } from "react";
import { getProfessionals, getSpecialtiesCatalog } from "../api/professionalsApi";
import type { Professional } from "../types";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

type Options = {
  initialSearch?: string;
  initialSpecialty?: string;
};

export function useProfessionalsFeed({ initialSearch = "", initialSpecialty = "Todos" }: Options = {}) {
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);

  const [items, setItems] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<string[]>(["Todos"]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const inFlightRef = useRef(false);

  // El buscador espera a que el usuario deje de escribir antes de pegarle al servidor.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void (async () => {
      try {
        const catalog = await getSpecialtiesCatalog();
        setSpecialties(["Todos", ...catalog]);
      } catch {
        // el catálogo es opcional: sin él quedan los chips por defecto
      }
    })();
  }, []);

  const fetchPage = useCallback(
    async (targetPage: number, mode: "reset" | "append" | "refresh") => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      if (mode === "reset") setLoading(true);
      if (mode === "append") setLoadingMore(true);
      if (mode === "refresh") setRefreshing(true);
      setError(null);

      try {
        const results = await getProfessionals({
          page: targetPage,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          specialty: selectedSpecialty,
        });

        setItems((prev) => {
          if (mode === "append") {
            const seen = new Set(prev.map((item) => item.id));
            return [...prev, ...results.filter((item) => !seen.has(item.id))];
          }
          return results;
        });

        setHasMore(results.length === PAGE_SIZE);
        pageRef.current = targetPage;
      } catch {
        setError("No se pudo cargar el listado de profesionales.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        inFlightRef.current = false;
      }
    },
    [debouncedSearch, selectedSpecialty],
  );

  useEffect(() => {
    void fetchPage(1, "reset");
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    void fetchPage(pageRef.current + 1, "append");
  }, [loading, loadingMore, refreshing, hasMore, fetchPage]);

  const refresh = useCallback(() => {
    void fetchPage(1, "refresh");
  }, [fetchPage]);

  return {
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
    hasMore,
    loadMore,
    refresh,
  };
}
