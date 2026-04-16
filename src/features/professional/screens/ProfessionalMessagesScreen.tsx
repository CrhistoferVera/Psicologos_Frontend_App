import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import AppCard from "../../../components/ui/AppCard";
import AppChip from "../../../components/ui/AppChip";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";
import { getMyProfessionalPrices, getProfessionalChats } from "../api/professionalApi";
import type { ProfessionalChatItem } from "../types";

type FilterMode = "active" | "all";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export default function ProfessionalMessagesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FilterMode>("active");
  const [items, setItems] = useState<ProfessionalChatItem[]>([]);
  const [chatPrice, setChatPrice] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [chats, prices] = await Promise.all([getProfessionalChats(), getMyProfessionalPrices()]);
        setItems(chats);
        setChatPrice(Number(prices.chat ?? 0));
      } catch {
        setError("No se pudieron cargar tus conversaciones.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (mode === "all") return items;
    return items.filter((item) => item.unreadCount > 0 || Boolean(item.lastMessage));
  }, [items, mode]);

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>Mensajes</Text>
        <Text style={styles.subtitle}>Gestiona conversaciones con tus clientes.</Text>

        <View style={styles.filters}>
          <AppChip label="Activos" active={mode === "active"} onPress={() => setMode("active")} />
          <AppChip label="Historial" active={mode === "all"} onPress={() => setMode("all")} />
          <View style={styles.pricePill}>
            <Text style={styles.pricePillText}>Tarifa chat: {chatPrice.toFixed(0)} cr</Text>
          </View>
        </View>

        {loading ? <Text style={styles.info}>Cargando conversaciones...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && filtered.length === 0 ? (
          <AppCard>
            <Text style={styles.info}>No hay conversaciones para este filtro.</Text>
          </AppCard>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.conversationId}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <Pressable
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
                <AppCard>
                  <View style={styles.chatRow}>
                    <Image
                      source={item.otherUserAvatar ? { uri: item.otherUserAvatar } : require("../../../../assets/no_image.jpg")}
                      style={styles.avatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.otherUserName}</Text>
                      <Text style={styles.message} numberOfLines={1}>{item.lastMessage ?? "Sin mensajes"}</Text>
                      <Text style={styles.meta}>Ingreso por mensaje segun tarifa configurada.</Text>
                    </View>
                    <View style={styles.rightCol}>
                      <Text style={styles.date}>{formatDate(item.lastMessageAt)}</Text>
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
        )}
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
  filters: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  pricePill: {
    backgroundColor: "#E6F2EC",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pricePillText: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
    fontSize: 12,
  },
  info: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    textAlign: "center",
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    textAlign: "center",
    fontSize: 12,
  },
  chatRow: {
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
  meta: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "600",
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 6,
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
    backgroundColor: appTheme.colors.success,
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
