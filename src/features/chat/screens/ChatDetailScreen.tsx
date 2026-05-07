import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
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
import { useSocket } from "../../../hooks/useSocket";
import { type CallType } from "../../../hooks/useCallSocket";
import { useCallManager } from "../../../context/CallContext";

type MessageUI = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

function normalizeMessages(raw: Message[]): MessageUI[] {
  return raw
    .map((item) => ({
      id: item.id,
      senderId: item.senderId,
      text: item.text ?? "",
      createdAt: item.createdAt,
    }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function formatMessageHour(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ChatDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    conversationId?: string | string[];
    professionalId?: string | string[];
    professionalName?: string | string[];
    professionalAvatar?: string | string[];
    hasActiveSession?: string | string[];
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MessageUI>>(null);
  const { onNewMessage } = useSocket(user?.id);
  const { startOutgoingCall } = useCallManager();

  const [messages, setMessages] = useState<MessageUI[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputHeight, setInputHeight] = useState(44);
  const [requestingCall, setRequestingCall] = useState(false);

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const rawConversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId;
  const rawProfessionalId = Array.isArray(params.professionalId) ? params.professionalId[0] : params.professionalId;
  const professionalId = rawProfessionalId ?? rawId;
  const resolvedConversationId = rawConversationId !== undefined ? rawConversationId : rawId;
  const professionalName = Array.isArray(params.professionalName)
    ? params.professionalName[0]
    : params.professionalName ?? "Profesional";
  const professionalAvatar = Array.isArray(params.professionalAvatar)
    ? params.professionalAvatar[0]
    : params.professionalAvatar ?? "";
  const hasActiveSession = Array.isArray(params.hasActiveSession)
    ? params.hasActiveSession[0] === "true"
    : params.hasActiveSession === "true";

  const [conversationId, setConversationId] = useState(resolvedConversationId);

  useEffect(() => {
    setConversationId(resolvedConversationId);
  }, [resolvedConversationId]);

  useEffect(() => {
    if (!user?.id) return;

    void (async () => {
      setError(null);
      setLoading(true);

      if (!conversationId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      try {
        const list = await getMessages(conversationId);
        setMessages(normalizeMessages(list));
        await markConversationAsRead(conversationId);
      } catch {
        setMessages([]);
        setError("Este chat aún no tiene historial o no está disponible.");
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId, user?.id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [messages.length]);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = onNewMessage((incoming) => {
      if (!incoming?.conversationId) return;
      if (incoming.conversationId !== conversationId) return;
      if (incoming.senderId === user.id) return;

      setMessages((prev) => {
        if (prev.some((msg) => msg.id === incoming.id)) return prev;
        return [
          ...prev,
          {
            id: incoming.id,
            senderId: incoming.senderId,
            text: incoming.text ?? "",
            createdAt: incoming.createdAt ?? new Date().toISOString(),
          },
        ];
      });

      void markConversationAsRead(incoming.conversationId);
    });

    return unsubscribe;
  }, [conversationId, onNewMessage, user?.id]);

  async function handleSend() {
    if (!text.trim() || !user?.id || !professionalId || sending) return;

    const payloadText = text.trim();
    setText("");
    setInputHeight(44);

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

      setMessages((prev) => [...prev, newMessage]);
      setError(null);
    } catch (err: any) {
      setText(payloadText);
      setError(err?.message ?? "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  async function handleRequestCall(callType: CallType) {
    if (requestingCall) return;
    if (!professionalId) {
      Alert.alert("No se pudo iniciar la llamada", "No se encontró el profesional para esta conversación.");
      return;
    }

    try {
      setRequestingCall(true);
      startOutgoingCall({
        receiverId: professionalId,
        receiverName: professionalName,
        receiverAvatar: professionalAvatar || null,
        callType,
      });
    } finally {
      setRequestingCall(false);
    }
  }

  const showEmpty = !loading && messages.length === 0 && !error;

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
          <Text style={styles.name} numberOfLines={1}>
            {professionalName}
          </Text>
          {hasActiveSession ? (
            <View style={styles.sessionBadgeRow}>
              <Ionicons name="calendar" size={10} color="#166534" />
              <Text style={styles.sessionBadgeText}>Sesion activa</Text>
            </View>
          ) : (
            <Text style={styles.sub}>• En línea</Text>
          )}
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={[styles.iconBtnMuted, requestingCall && styles.iconBtnMutedDisabled]}
            disabled={requestingCall}
            onPress={() => handleRequestCall("CALL")}
          >
            <Ionicons name="call" size={16} color="#C0267A" />
          </Pressable>
          <Pressable
            style={[styles.iconBtnMuted, requestingCall && styles.iconBtnMutedDisabled]}
            disabled={requestingCall}
            onPress={() => handleRequestCall("VIDEO_CALL")}
          >
            <Ionicons name="videocam" size={16} color="#6C5BB6" />
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.chatBody}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 6 : 0}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={appTheme.colors.primary} />
            <Text style={styles.loadingText}>Cargando mensajes...</Text>
          </View>
        ) : null}

        {showEmpty ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={appTheme.colors.textMuted} />
            <Text style={styles.emptyText}>Aún no hay mensajes en esta conversación.</Text>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<Text style={styles.timeSeparator}>Hoy</Text>}
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
                    {formatMessageHour(item.createdAt)}
                    {mine ? " ✓✓" : ""}
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
            style={[styles.input, { height: Math.min(Math.max(inputHeight, 44), 120) }]}
            multiline
            maxLength={1200}
            onContentSizeChange={(event) => {
              setInputHeight(event.nativeEvent.contentSize.height + 16);
            }}
          />

          <Pressable
            style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
            disabled={!text.trim() || sending}
            onPress={handleSend}
          >
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
    backgroundColor: "#FFFFFF",
  },

  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },

  iconBtnMuted: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },

  iconBtnMutedDisabled: {
    opacity: 0.55,
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
    fontWeight: "600",
  },
  sessionBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: appTheme.fonts.body,
    color: "#166534",
  },

  errorWrap: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },

  errorText: {
    color: "#991B1B",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
  },

  chatBody: {
    flex: 1,
  },

  loadingWrap: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  loadingText: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },

  emptyWrap: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  emptyText: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },

  timeSeparator: {
    alignSelf: "center",
    marginBottom: 10,
    color: "#64748B",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
  },

  messages: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
    flexGrow: 1,
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
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },

  mine: {
    backgroundColor: appTheme.colors.primary,
    borderBottomRightRadius: 8,
  },

  theirs: {
    backgroundColor: "#FFFFFF",
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
    color: "#64748B",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "right",
  },

  messageMetaMine: {
    color: "rgba(255,255,255,0.88)",
  },

  inputBar: {
    paddingTop: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    backgroundColor: "#FFFFFF",
  },

  leftIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  input: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    color: appTheme.colors.text,
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
    marginBottom: 2,
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },
});

