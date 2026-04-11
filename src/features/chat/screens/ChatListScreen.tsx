import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { appTheme } from "../../../theme/appTheme";
import { getChats, type Chat } from "../../../api/messages";

function formatShortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      try {
        const data = await getChats(user.id);
        setChats(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>Chats</Text>
        <Text style={styles.subtitle}>Tus conversaciones con profesionales.</Text>

        {loading ? <Text style={styles.empty}>Cargando conversaciones...</Text> : null}

        {!loading && chats.length === 0 ? (
          <AppCard>
            <Text style={styles.empty}>Aún no tienes conversaciones activas.</Text>
          </AppCard>
        ) : null}

        <FlatList
          data={chats}
          scrollEnabled={false}
          keyExtractor={(item) => item.conversationId}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Pressable
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
              <AppCard>
                <View style={styles.row}>
                  <Image
                    source={item.otherUserAvatar ? { uri: item.otherUserAvatar } : require("../../../../assets/no_image.jpg")}
                    style={styles.avatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.otherUserName}</Text>
                    <Text style={styles.message} numberOfLines={1}>
                      {item.lastMessage ?? "Sin mensajes aún"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={styles.date}>{formatShortDate(item.lastMessageAt)}</Text>
                    {item.unreadCount > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unreadCount}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </AppCard>
            </Pressable>
          )}
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
    fontFamily: appTheme.fonts.body,
  },
  empty: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E2E8F0",
  },
  name: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 15,
  },
  message: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  date: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  unreadBadge: {
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
    fontSize: 11,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
  },
});

