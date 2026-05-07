import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { appTheme } from "../../../theme/appTheme";
import { getMyChats, type Chat } from "../../../api/messages";
import { apiGetMyActiveSessions } from "../../../api/sessions";

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

  const week = ["Dom", "Lun", "Mie", "Jue", "Vie", "Sab"];
  return week[date.getDay()] ?? "";
}

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionProfIds, setActiveSessionProfIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) {
      setChats([]);
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, activeSessions] = await Promise.all([
          getMyChats(),
          apiGetMyActiveSessions().catch(() => []),
        ]);
        setChats(data);
        setActiveSessionProfIds(
          new Set(activeSessions.map((s) => s.professional?.id).filter((id): id is string => Boolean(id))),
        );
      } catch {
        setError("No se pudieron cargar tus chats.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  return (
    <AppScreen contentPadding={0}>
      <View style={styles.page}>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.conversationId}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={styles.title}>Mensajes</Text>
              {loading ? <Text style={styles.helper}>Cargando conversaciones...</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: "/(user)/chats/[id]",
                  params: {
                    id: item.conversationId,
                    professionalId: item.otherUserId,
                    professionalName: item.otherUserName,
                    professionalAvatar: item.otherUserAvatar ?? "",
                    hasActiveSession: activeSessionProfIds.has(item.otherUserId) ? "true" : "false",
                  },
                } as any)
              }
            >
              <View style={styles.avatarWrap}>
                <Image
                  source={item.otherUserAvatar ? { uri: item.otherUserAvatar } : require("../../../../assets/no_image.jpg")}
                  style={styles.avatar}
                />
                <View style={styles.onlineDot} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.otherUserName}
                  </Text>
                  {activeSessionProfIds.has(item.otherUserId) ? (
                    <View style={styles.sessionBadge}>
                      <Ionicons name="calendar" size={9} color="#166534" />
                      <Text style={styles.sessionBadgeText}>Sesion activa</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.message} numberOfLines={1}>
                  {item.lastMessage ?? "Aún no hay mensajes"}
                </Text>
              </View>

              <View style={styles.rightCol}>
                <Text style={styles.date}>{formatConversationDate(item.lastMessageAt)}</Text>
                {item.unreadCount > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={appTheme.colors.textMuted} />
                <Text style={styles.helper}>Aún no tienes conversaciones activas.</Text>
              </View>
            ) : null
          }
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
    paddingBottom: 12,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 32,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    marginBottom: 12,
  },
  helper: {
    marginTop: 8,
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    textAlign: "center",
  },
  error: {
    marginTop: 8,
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    textAlign: "center",
    fontSize: 12,
  },
  separator: {
    height: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 16,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 15,
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
  },
  onlineDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: appTheme.colors.success,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  name: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 18,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  sessionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sessionBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: appTheme.fonts.body,
    color: "#166534",
  },
  message: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 16,
    marginTop: 2,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 6,
  },
  date: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
  },
  emptyWrap: {
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});

