import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import PostCard from "@/src/components/cliente/PostCard";
import ClienteCreditsHeaderTitle from "@/src/components/cliente/home/ClienteCreditsHeaderTitle";
import RechargeHeaderButton from "@/src/components/cliente/home/RechargeHeaderButton";
import { getPublicHostesses } from "@/src/services/hostesses";
import { apiGetSavedAnfitrionas } from "@/src/api/savedAnfitriona";
import { apiGetMyWallet } from "@/src/api/userClient";
import type { Anfitriona } from "@/src/types/anfitriona";
import { StoriesBarFeed } from "@/src/components/user/StoriesBarFeed";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  BackHandler,
  FlatList,
  LayoutChangeEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { apiGetStoriesFeed } from "@/src/api/anfitrionaHistory";
import { HistoryFeedItem } from "@/src/types/historyViewClient";

export default function ClienteInicio() {
  const [anfitrionas, setAnfitrionas] = useState<Anfitriona[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedHeight, setFeedHeight] = useState(0);
  const [storiesBarHeight, setStoriesBarHeight] = useState(0);
  const [page, setPage] = useState(1);
  const hasMore = useRef(true);
  const feedContainerRef = useRef<View>(null);

  const router = useRouter();
  const { logout } = useAuth();
  const [feed, setFeed] = useState<HistoryFeedItem[]>([]);
  const [credits, setCredits] = useState<number>(15);

  const loadFeed = async () => {
    try {
      const data = await apiGetStoriesFeed();
      setFeed(data ?? []);
    } catch (e) {
      console.error("Error cargando historias:", e);
      setFeed([]);
    }
  };


  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Salir',
          'Seguro que quieres salir',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Salir',
              style: 'destructive',
              onPress: async () => {
                await logout();
                BackHandler.exitApp();
              },
            },
          ],
        );
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [logout]),
  );

  const loadCredits = useCallback(async () => {
    try {
      const wallet = await apiGetMyWallet();
      const parsedBalance = Number(wallet?.balance);
      if (Number.isFinite(parsedBalance)) {
        setCredits(Math.max(0, Math.floor(parsedBalance)));
      }
    } catch {
      setCredits(15);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCredits();
    }, [loadCredits])
  );

  // Re-mide el contenedor cuando la app vuelve del segundo plano
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        feedContainerRef.current?.measure((_x, _y, _w, height) => {
          const h = Math.round(height);
          if (h > 0) setFeedHeight(h);
        });
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);

  const handleFeedLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    if (nextHeight !== feedHeight) setFeedHeight(nextHeight);
  };

  const loadAnfitrionas = async () => {
    setLoading(true);
    setError(null);
    hasMore.current = true;
    try {
      const [result, saved] = await Promise.all([
        getPublicHostesses(1),
        apiGetSavedAnfitrionas().catch(() => ({ data: [], nextCursor: null })),
      ]);
      const savedIds = new Set(saved.data.map((s) => s.id));
      setAnfitrionas(result.anfitrionas.map((a) => ({ ...a, isFavorite: savedIds.has(a.id) })));
      setPage(1);
      hasMore.current = result.hasMore;
    } catch {
      setError("No se pudieron cargar las anfitrionas. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      // Si ya no hay más páginas, volvemos a la página 1 (loop infinito)
      const looping = !hasMore.current;
      const nextPage = looping ? 1 : page + 1;
      const [result, saved] = await Promise.all([
        getPublicHostesses(nextPage),
        apiGetSavedAnfitrionas().catch(() => ({ data: [], nextCursor: null })),
      ]);
      const savedIds = new Set(saved.data.map((s) => s.id));
      const newItems = result.anfitrionas.map((a) => ({ ...a, isFavorite: savedIds.has(a.id) }));
      setAnfitrionas((prev) => {
        if (looping) return newItems;
        const existingIds = new Set(prev.map((a) => a.id));
        return [...prev, ...newItems.filter((a) => !existingIds.has(a.id))];
      });
      setPage(nextPage);
      hasMore.current = result.hasMore;
    } catch {
      // silencioso
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page]);

  useFocusEffect(
    useCallback(() => {
      void loadAnfitrionas();
    }, [])
  );

  const handleStorySelect = (item: HistoryFeedItem) => {
    if (!item.stories || item.stories.length === 0) {
      console.warn(`La anfitriona ${item.name} no tiene historias activas.`);
      return;
    }
    const formattedStories = item.stories.map((s) => ({
      id: s.id,
      uri: s.mediaUrl,
      type: s.mediaType === "VIDEO" ? "video" : "image",
      duration: 5,
    }));
    router.push({
      pathname: "/story-viewer",
      params: {
        data: JSON.stringify({
          id: item.userId,
          name: item.name,
          avatar: item.avatar,
          stories: formattedStories,
        }),
      },
    });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-black">
      <ScreenHeader
        title="ANFITRIONAS"
        role="cliente"
        renderHeaderTitle={() => <ClienteCreditsHeaderTitle credits={credits} />}
        renderHeaderRight={() => (
          <RechargeHeaderButton onPress={() => router.push("/(cliente)/credito")} />
        )}
      />


      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      )}

      {!loading && error && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-white text-center text-base mb-4">{error}</Text>
          <TouchableOpacity
            onPress={loadAnfitrionas}
            style={{
              backgroundColor: "#ec4899",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}


      {!loading && !error && anfitrionas.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: "#6b7280", fontSize: 16 }}>
            No hay anfitrionas disponibles por el momento.
          </Text>
        </View>
      )}


      {!loading && !error && anfitrionas.length > 0 && (
        <View ref={feedContainerRef} style={{ flex: 1 }} onLayout={handleFeedLayout}>
          <FlatList
            data={anfitrionas}
            keyExtractor={(item) => item.id}
            pagingEnabled
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <View
                className="-mt-1"
                onLayout={(e) => {
                  const h = Math.round(e.nativeEvent.layout.height);
                  if (h !== storiesBarHeight) setStoriesBarHeight(h);
                }}
              >
                <StoriesBarFeed stories={feed} onSelect={handleStorySelect} />
              </View>
            }
            renderItem={({ item, index }) => (
              <PostCard
                anfitriona={item}
                height={index === 0 ? feedHeight - storiesBarHeight : feedHeight}
              />
            )}
            ListFooterComponent={
              loadingMore ? (
                <View
                  style={{
                    height: feedHeight,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="large" color="#ec4899" />
                </View>
              ) : null
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

