import { useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appTheme } from "../../../theme/appTheme";
import { useAuth } from "../../../context/AuthContext";
import { getMyChats } from "../../../api/messages";
import { getCommunicationAccess, type CommunicationAccess } from "../../../api/communication";
import { getProfessionals } from "../../professionals/api/professionalsApi";
import type { Professional } from "../../professionals/types";
import ProfessionalFeedCard from "../components/ProfessionalFeedCard";

const PAGE_SIZE = 10;
const FEED_REFRESH_TTL_MS = 60 * 1000;

type CommunicationAccessByProfessional = Record<string, CommunicationAccess>;
type CommunicationAccessLoadingByProfessional = Record<string, boolean>;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);
  const [feedHeight, setFeedHeight] = useState(0);
  const [communicationAccessByProfessional, setCommunicationAccessByProfessional] =
    useState<CommunicationAccessByProfessional>({});
  const [communicationAccessLoadingByProfessional, setCommunicationAccessLoadingByProfessional] =
    useState<CommunicationAccessLoadingByProfessional>({});

  const loadingRef = useRef(false);
  const feedRef = useRef<FlatList<Professional> | null>(null);
  const wrapPendingRef = useRef(false);
  const lastLoadedAtRef = useRef(0);

  async function loadFeed(targetPage: number, reset: boolean) {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      if (reset) {
        setLoading(true);
        wrapPendingRef.current = false;
      } else {
        setLoadingMore(true);
      }

      const results = await getProfessionals({ page: targetPage, limit: PAGE_SIZE });

      if (reset) {
        setProfessionals(results);
      } else {
        setProfessionals((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const fresh = results.filter((p) => !existingIds.has(p.id));
          return [...prev, ...fresh];
        });
      }

      setHasMore(results.length === PAGE_SIZE);
      setPage(targetPage);
      lastLoadedAtRef.current = Date.now();
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }

  useFocusEffect(
    useCallback(() => {
      const stale = Date.now() - lastLoadedAtRef.current > FEED_REFRESH_TTL_MS;
      if (professionals.length === 0 || stale) {
        void loadFeed(1, true);
      }
    }, [professionals.length]),
  );

  useEffect(() => {
    if (!user?.id || professionals.length === 0) return;

    const idsToFetch = professionals
      .map((p) => p.id)
      .filter(
        (id) =>
          !(id in communicationAccessByProfessional) &&
          communicationAccessLoadingByProfessional[id] !== true,
      );

    if (idsToFetch.length === 0) return;

    setCommunicationAccessLoadingByProfessional((prev) => {
      const next = { ...prev };
      idsToFetch.forEach((id) => { next[id] = true; });
      return next;
    });

    void Promise.all(
      idsToFetch.map(async (id) => {
        try {
          const access = await getCommunicationAccess(id);
          return { id, access };
        } catch {
          return {
            id,
            access: {
              allowed: false,
              bookingId: null,
              sessionStartsAt: null,
              sessionEndsAt: null,
              reason: "UNKNOWN",
              message: "No se pudo validar el acceso de comunicación.",
            } as CommunicationAccess,
          };
        }
      }),
    ).then((results) => {
      setCommunicationAccessByProfessional((prev) => {
        const next = { ...prev };
        results.forEach(({ id, access }) => { next[id] = access; });
        return next;
      });
      setCommunicationAccessLoadingByProfessional((prev) => {
        const next = { ...prev };
        results.forEach(({ id }) => { next[id] = false; });
        return next;
      });
    });
  }, [communicationAccessByProfessional, communicationAccessLoadingByProfessional, professionals, user?.id]);

  function handleLoadMore() {
    if (!hasMore || loadingMore || loadingRef.current) return;
    void loadFeed(page + 1, false);
  }

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const itemCount = professionals.length;

    if (hasMore || loadingMore || itemCount <= 1 || CARD_HEIGHT <= 0) {
      wrapPendingRef.current = false;
      return;
    }

    const offsetY = Math.max(0, event.nativeEvent.contentOffset.y);
    const rawIndex = offsetY / CARD_HEIGHT;
    const currentIndex = Math.min(itemCount - 1, Math.floor(rawIndex + 0.0001));
    const lastIndex = itemCount - 1;

    if (currentIndex < lastIndex) {
      wrapPendingRef.current = false;
      return;
    }

    if (!wrapPendingRef.current) {
      wrapPendingRef.current = true;
      return;
    }

    wrapPendingRef.current = false;
    requestAnimationFrame(() => {
      feedRef.current?.scrollToIndex({ index: 0, animated: false });
    });
  }

  function handleProfile(pro: Professional) {
    router.push({
      pathname: "/(user)/professionals/[id]",
      params: { id: pro.id },
    } as any);
  }

  async function handleChat(pro: Professional) {
    if (chatLoadingId) return;

    setChatLoadingId(pro.id);
    try {
      const access =
        communicationAccessByProfessional[pro.id] ?? (await getCommunicationAccess(pro.id));

      if (!access.allowed) {
        Alert.alert("Comunicación no disponible", access.message ?? "Reserva una sesión para habilitar mensajes y llamadas.");
        return;
      }

      const chats = await getMyChats();
      const existing = chats.find((c) => c.otherUserId === pro.id);
      router.push({
        pathname: "/(user)/chats/[id]",
        params: {
          id: existing?.conversationId || pro.id,
          conversationId: existing?.conversationId ?? "",
          professionalId: pro.id,
          professionalName: pro.name,
          professionalAvatar: pro.avatar,
        },
      } as any);
    } catch {
      router.push({
        pathname: "/(user)/chats/[id]",
        params: {
          id: pro.id,
          conversationId: "",
          professionalId: pro.id,
          professionalName: pro.name,
          professionalAvatar: pro.avatar,
        },
      } as any);
    } finally {
      setChatLoadingId(null);
    }
  }

  const CARD_HEIGHT = feedHeight > 0 ? feedHeight : 500;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerGreeting}>
              {user?.firstName ? `Hola, ${user.firstName}` : "Bienvenido"}
            </Text>
            <Text style={styles.headerTitle}>Psicólogos disponibles</Text>
          </View>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => router.push("/(user)/professionals" as any)}
          >
            <Ionicons name="search" size={20} color={appTheme.colors.primary} />
          </Pressable>
        </View>
      </View>

      <View
        style={styles.feedContainer}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0) setFeedHeight(h);
        }}
      >
        {loading ? (
          <View style={styles.feedState}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
            <Text style={styles.feedStateText}>Cargando profesionales...</Text>
          </View>
        ) : professionals.length === 0 ? (
          <View style={styles.feedState}>
            <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.feedStateText}>
              No hay profesionales disponibles en este momento.
            </Text>
            <Pressable style={styles.retryBtn} onPress={() => loadFeed(1, true)}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={feedRef}
            data={professionals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProfessionalFeedCard
                professional={item}
                cardHeight={CARD_HEIGHT}
                onProfilePress={() => handleProfile(item)}
                onChatPress={() => handleChat(item)}
                chatLoading={chatLoadingId === item.id}
                communicationAccess={communicationAccessByProfessional[item.id] ?? null}
                communicationAccessLoading={
                  communicationAccessLoadingByProfessional[item.id] === true
                }
              />
            )}
            snapToInterval={CARD_HEIGHT}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            onMomentumScrollEnd={handleMomentumEnd}
            getItemLayout={(_, index) => ({
              length: CARD_HEIGHT,
              offset: CARD_HEIGHT * index,
              index,
            })}
            onScrollToIndexFailed={() => {
              feedRef.current?.scrollToOffset({ offset: 0, animated: false });
            }}
            ListFooterComponent={
              loadingMore ? (
                <View style={[styles.footerLoader, { height: CARD_HEIGHT }]}>
                  <ActivityIndicator color={appTheme.colors.primary} size="large" />
                  <Text style={styles.feedStateText}>Cargando más...</Text>
                </View>
              ) : null
            }
            windowSize={3}
            maxToRenderPerBatch={3}
            initialNumToRender={2}
            removeClippedSubviews
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0f1a",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
  },
  headerGreeting: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  headerTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  feedContainer: {
    flex: 1,
  },
  feedState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 32,
  },
  feedStateText: {
    color: "rgba(255,255,255,0.50)",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: appTheme.colors.primary,
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  footerLoader: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#0a0f1a",
  },
});
