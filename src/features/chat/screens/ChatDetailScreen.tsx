import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { appTheme } from "../../../theme/appTheme";
import { getMessages, markConversationAsRead, sendMessageToUser, type Message } from "../../../api/messages";
import { apiGetMyWallet } from "../../../api/userClient";

type MessageUI = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

function normalizeMessages(raw: Message[]): MessageUI[] {
  return raw.map((item) => ({
    id: item.id,
    senderId: item.senderId,
    text: item.text ?? "",
    createdAt: item.createdAt,
  }));
}

function formatMessageHour(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ChatDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    professionalId?: string | string[];
    professionalName?: string | string[];
    professionalAvatar?: string | string[];
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<MessageUI[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const rawProfessionalId = Array.isArray(params.professionalId) ? params.professionalId[0] : params.professionalId;
  const professionalId = rawProfessionalId ?? rawId;
  const professionalName = Array.isArray(params.professionalName)
    ? params.professionalName[0]
    : params.professionalName ?? "Profesional";
  const professionalAvatar = Array.isArray(params.professionalAvatar)
    ? params.professionalAvatar[0]
    : params.professionalAvatar ?? "";

  const [conversationId, setConversationId] = useState(rawId);

  useEffect(() => {
    setConversationId(rawId);
  }, [rawId]);

  useEffect(() => {
    if (!user?.id) return;

    void (async () => {
      setError(null);

      try {
        const wallet = await apiGetMyWallet();
        setBalance(wallet?.balance ?? 0);
      } catch {
        // Wallet errors should not block the chat view
      }

      if (!conversationId) {
        setMessages([]);
        return;
      }

      try {
        const list = await getMessages(conversationId);
        setMessages(normalizeMessages(list));
        await markConversationAsRead(conversationId);
      } catch {
        setMessages([]);
        setError("Este chat aun no tiene historial o no esta disponible.");
      }
    })();
  }, [conversationId, user?.id]);

  const lowBalance = useMemo(() => balance < 15, [balance]);

  async function handleSend() {
    if (!text.trim() || !user?.id || !professionalId) return;

    const payloadText = text.trim();
    setText("");

    try {
      setSending(true);
      const sent = await sendMessageToUser(professionalId, payloadText);

      const newMessage: MessageUI = {
        id: sent.id ?? `temp-${Date.now()}`,
        senderId: user.id,
        text: sent.text ?? payloadText,
        createdAt: sent.createdAt ?? new Date().toISOString(),
      };

      if (sent.conversationId) {
        setConversationId(sent.conversationId);
      }

      setMessages((prev) => [newMessage, ...prev]);
      setBalance((prev) => Math.max(prev - 1, 0));
      setError(null);
    } catch (err: any) {
      setText(payloadText);
      setError(err?.message ?? "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  const headerDate = messages.length > 0 ? formatMessageHour(messages[messages.length - 1].createdAt) : "10:00";

  return (
    <View style={styles.page}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={18} color={appTheme.colors.text} />
        </Pressable>

        <Image
          source={professionalAvatar ? { uri: professionalAvatar } : require("../../../../assets/no_image.jpg")}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{professionalName}</Text>
          <Text style={styles.sub}>• En línea</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtnMuted}>
            <Ionicons name="call" size={16} color="#C0267A" />
          </Pressable>
          <Pressable style={styles.iconBtnMuted}>
            <Ionicons name="videocam" size={16} color="#6C5BB6" />
          </Pressable>
        </View>
      </View>

      <View style={styles.balanceWrap}>
        <Pressable style={styles.balanceCard} onPress={() => router.push("/(user)/credits" as any)}>
          <View style={styles.balanceLeft}>
            <Ionicons name="card-outline" size={16} color={appTheme.colors.primary} />
            <Text style={styles.balanceText}>Saldo: </Text>
            <Text style={styles.balanceStrong}>{Math.floor(balance)}</Text>
            <Text style={styles.balanceText}>   15 crd/mensaje</Text>
          </View>
          <Text style={styles.balanceAction}>Recargar</Text>
        </Pressable>
      </View>

      {lowBalance ? (
        <View style={styles.warningWrap}>
          <Text style={styles.warningText}>Saldo bajo para enviar mensajes.</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 10}
      >
        <View style={styles.timeSeparatorWrap}>
          <Text style={styles.timeSeparator}>Hoy · {headerDate}</Text>
        </View>

        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowTheirs]}>
                {!mine ? (
                  <Image
                    source={professionalAvatar ? { uri: professionalAvatar } : require("../../../../assets/no_image.jpg")}
                    style={styles.bubbleAvatar}
                  />
                ) : null}

                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.text}</Text>
                  <Text style={[styles.messageMeta, mine && styles.messageMetaMine]}>
                    {formatMessageHour(item.createdAt)}{mine ? " ✓✓" : ""}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}> 
          <Pressable style={styles.leftIconBtn}>
            <Ionicons name="happy-outline" size={18} color="#8898AA" />
          </Pressable>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />

          <Pressable style={[styles.sendButton, sending && { opacity: 0.6 }]} disabled={sending} onPress={handleSend}>
            <Ionicons name="arrow-up" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  header: {
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: appTheme.colors.surface,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2F7",
  },
  iconBtnMuted: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0EDF9",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },
  name: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
  },
  sub: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  balanceWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: appTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  balanceCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A9D0F5",
    backgroundColor: "#EEF6FF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceText: {
    color: "#526780",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  balanceStrong: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
  },
  balanceAction: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "700",
  },
  warningWrap: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  warningText: {
    color: "#9A4C00",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  errorWrap: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FEE2E2",
    borderBottomWidth: 1,
    borderBottomColor: "#FCA5A5",
  },
  errorText: {
    color: "#991B1B",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
  },
  timeSeparatorWrap: {
    paddingTop: 10,
    alignItems: "center",
  },
  timeSeparator: {
    color: "#94A3B8",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  messages: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowTheirs: {
    justifyContent: "flex-start",
  },
  bubbleAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E2E8F0",
    marginBottom: 4,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  mine: {
    backgroundColor: appTheme.colors.primary,
    borderBottomRightRadius: 8,
  },
  theirs: {
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderBottomLeftRadius: 8,
  },
  messageText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextMine: {
    color: "#FFFFFF",
  },
  messageMeta: {
    marginTop: 4,
    color: "#94A3B8",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "right",
  },
  messageMetaMine: {
    color: "rgba(255,255,255,0.85)",
  },
  inputBar: {
    paddingTop: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
  },
  leftIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#EEF2F7",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D4DEE9",
    paddingHorizontal: 14,
    color: appTheme.colors.text,
    minHeight: 42,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});

