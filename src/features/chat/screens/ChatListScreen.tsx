import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { appTheme } from "../../../theme/appTheme";
import { getMyChats, type Chat } from "../../../api/messages";
import { apiGetMyWallet } from "../../../api/userClient";

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

  const week = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  return week[date.getDay()] ?? "";
}

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const [chatData, walletData] = await Promise.allSettled([getMyChats(), apiGetMyWallet()]);

        if (chatData.status === "fulfilled") {
          setChats(chatData.value);
        } else {
          setError("No se pudieron cargar tus chats.");
        }

        if (walletData.status === "fulfilled") {
          setBalance(walletData.value?.balance ?? 0);
        }
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

              <Pressable style={styles.balanceCard} onPress={() => router.push("/(user)/credits")}>
                <View style={styles.balanceLeft}>
                  <Ionicons name="card-outline" size={16} color={appTheme.colors.primary} />
                  <View>
                    <Text style={styles.balanceLabel}>Saldo disponible</Text>
                    <Text style={styles.balanceValue}>{Math.floor(balance)} créditos</Text>
                  </View>
                </View>
                <View style={styles.balanceRight}>
                  <Text style={styles.rechargeText}>Recargar</Text>
                  <Ionicons name="arrow-forward" size={14} color={appTheme.colors.primary} />
                </View>
              </Pressable>

              {loading ? <Text style={styles.helper}>Cargando conversaciones...</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            <View style={styles.footerWrap}>
              <Ionicons name="bulb-outline" size={16} color="#B45309" />
              <Text style={styles.footerText}>Cada mensaje consume créditos. Asegúrate de tener saldo suficiente.</Text>
            </View>
          }
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
                <Text style={styles.name} numberOfLines={1}>
                  {item.otherUserName}
                </Text>
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
  balanceCard: {
    borderWidth: 1,
    borderColor: "#D1DAE6",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F7FAFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  balanceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  balanceValue: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  balanceRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rechargeText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "700",
  },
  helper: {
    marginTop: 8,
    color: appTheme.colors.textMuted,
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
    borderColor: "#E9EEF5",
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
  message: {
    color: appTheme.colors.textMuted,
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
    borderColor: "#E9EEF5",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  footerWrap: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#F8E6B8",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  footerText: {
    flex: 1,
    color: "#9A4C00",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
});
