import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getMyProfessionalPrices, getProfessionalChats } from "../api/professionalApi";
import type { ProfessionalChatItem } from "../types";

type FilterMode = "active" | "history" | "archived";

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isYesterday(date: Date, now: Date) {
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  return isSameDay(date, y);
}

function formatConversationDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  if (isSameDay(date, now)) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  if (isYesterday(date, now)) return "Ayer";

  const week = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return week[date.getDay()] ?? "";
}

export default function ProfessionalMessagesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FilterMode>("active");

  const [items, setItems] = useState<ProfessionalChatItem[]>([]);
  const [chatPrice, setChatPrice] = useState(15);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const [chats, prices] = await Promise.all([getProfessionalChats(), getMyProfessionalPrices()]);

        setItems(Array.isArray(chats) ? chats : []);
        setChatPrice(Number(prices.chat ?? 15) || 15);
      } catch {
        setError("No se pudieron cargar tus conversaciones.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unreadTotal = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.unreadCount ?? 0), 0),
    [items],
  );

  const filtered = useMemo(() => {
    if (mode === "active") return items;

    if (mode === "history") {
      const history = items.filter((item) => Number(item.unreadCount ?? 0) === 0);
      return history.length > 0 ? history : items;
    }

    return [] as ProfessionalChatItem[];
  }, [items, mode]);

  function rowCredits(item: ProfessionalChatItem) {
    const unread = Number(item.unreadCount ?? 0);
    if (unread > 0) return unread * chatPrice;
    return chatPrice;
  }

  return (
    <AppScreen contentPadding={0}>
      <View style={styles.page}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.conversationId}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Bandeja de mensajes</Text>
                <View style={styles.counterBadge}>
                  <Text style={styles.counterText}>{unreadTotal}</Text>
                </View>
              </View>

              <View style={styles.tabsRow}>
                <Pressable
                  style={[styles.tabBtn, mode === "active" && styles.tabBtnActive]}
                  onPress={() => setMode("active")}
                >
                  <Text style={[styles.tabText, mode === "active" && styles.tabTextActive]}>Activos</Text>
                </Pressable>

                <Pressable
                  style={[styles.tabBtn, mode === "history" && styles.tabBtnActive]}
                  onPress={() => setMode("history")}
                >
                  <Text style={[styles.tabText, mode === "history" && styles.tabTextActive]}>Historial</Text>
                </Pressable>

                <Pressable
                  style={[styles.tabBtn, mode === "archived" && styles.tabBtnActive]}
                  onPress={() => setMode("archived")}
                >
                  <Text style={[styles.tabText, mode === "archived" && styles.tabTextActive]}>Archivados</Text>
                </Pressable>
              </View>

              {loading ? <Text style={styles.helper}>Cargando conversaciones...</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  {mode === "archived"
                    ? "No tienes conversaciones archivadas."
                    : "Aún no tienes conversaciones para este filtro."}
                </Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const credits = rowCredits(item);

            return (
              <Pressable
                style={styles.row}
                onPress={() =>
                  router.push({
                    pathname: "/(professional)/messages/[id]",
                    params: {
                      id: item.conversationId,
                      clientId: item.otherUserId,
                      clientName: item.otherUserName,
                      clientAvatar: item.otherUserAvatar ?? "",
                    },
                  } as any)
                }
              >
                <View style={styles.avatarWrap}>
                  <Image
                    source={item.otherUserAvatar ? { uri: item.otherUserAvatar } : require("../../../../assets/no_image.jpg")}
                    style={styles.avatar}
                  />
                  {item.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.rowHead}>
                    <Text style={styles.name}>{item.otherUserName}</Text>
                    <Text style={styles.time}>{formatConversationDate(item.lastMessageAt)}</Text>
                  </View>

                  <Text style={styles.message} numberOfLines={1}>
                    {item.lastMessage ?? "Sin mensajes recientes"}
                  </Text>
                </View>

                <View style={styles.creditPill}>
                  <Text style={styles.creditPillText}>+{credits} crd</Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#1F3651",
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
  },
  counterBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  counterText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  tabsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D7E0EA",
    backgroundColor: "#F2F5F9",
    minHeight: 34,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    borderColor: appTheme.colors.success,
    backgroundColor: appTheme.colors.success,
  },
  tabText: {
    color: "#607690",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  helper: {
    marginTop: 8,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
  },
  error: {
    marginTop: 8,
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
  },
  row: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#E8EEF5",
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  unreadBadge: {
    position: "absolute",
    right: -2,
    top: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
  },
  rowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    color: "#1F3651",
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  time: {
    color: "#8AA0BA",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  message: {
    marginTop: 2,
    color: "#5F7896",
    fontFamily: appTheme.fonts.body,
    fontSize: 17,
  },
  creditPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#E6F4EC",
  },
  creditPillText: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyWrap: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
  },
});
