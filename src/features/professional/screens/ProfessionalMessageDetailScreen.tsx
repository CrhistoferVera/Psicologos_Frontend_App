import { useEffect, useMemo, useRef, useState } from "react";
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
import { ArrowLeft } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { appTheme } from "../../../theme/appTheme";
import { getMessages, markConversationAsRead, sendMessageToUser, type Message } from "../../../api/messages";
import { getCommunicationAccess, type CommunicationAccess } from "../../../api/communication";
import { useSocket } from "../../../hooks/useSocket";
import { useCallManager } from "../../../context/CallContext";
import { useSessionRemaining } from "../../../hooks/useSessionRemaining";
import { formatRemainingMinText } from "../../../utils/sessionTime";

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

function formatMessageHour(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ProfessionalMessageDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    clientId?: string | string[];
    clientName?: string | string[];
    clientAvatar?: string | string[];
  }>();

  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MessageUI>>(null);
  const { onNewMessage } = useSocket(user?.id);
  const { startOutgoingCall } = useCallManager();

  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const clientIdRaw = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;
  const clientId = clientIdRaw ?? "";
  const clientName = Array.isArray(params.clientName) ? params.clientName[0] : params.clientName ?? "Cliente";
  const clientAvatar = Array.isArray(params.clientAvatar) ? params.clientAvatar[0] : params.clientAvatar ?? "";

  const [messages, setMessages] = useState<MessageUI[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputHeight, setInputHeight] = useState(44);
  const [requestingCall, setRequestingCall] = useState(false);
  const [communicationAccess, setCommunicationAccess] = useState<CommunicationAccess | null>(null);
  const [communicationLoading, setCommunicationLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setCommunicationLoading(false);
      return;
    }

    let cancelled = false;

    const loadAccess = async (showLoader: boolean) => {
      if (showLoader) setCommunicationLoading(true);
      try {
        const access = await getCommunicationAccess(clientId);
        if (!cancelled) setCommunicationAccess(access);
      } catch {
        if (!cancelled) {
          setCommunicationAccess({
            allowed: false,
            bookingId: null,
            sessionStartsAt: null,
            sessionEndsAt: null,
            reason: "UNKNOWN",
            message: "No se pudo validar el acceso de comunicacion.",
          });
        }
      } finally {
        if (!cancelled && showLoader) setCommunicationLoading(false);
      }
    };

    void loadAccess(true);
    const timer = setInterval(() => {
      void loadAccess(false);
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [clientId]);

  useEffect(() => {
    if (!conversationId || !user?.id) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await getMessages(conversationId);
        setMessages(normalizeMessages(list));
        await markConversationAsRead(conversationId);
      } catch {
        setError("No se pudo cargar el historial de mensajes.");
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

  const { remainingMs: sessionRemainingMs, isExpired: sessionExpired } = useSessionRemaining(
    communicationAccess?.sessionEndsAt,
    60_000,
  );
  const canCommunicateByAccess = communicationAccess?.allowed === true;
  const hasActiveSessionNow = canCommunicateByAccess && !sessionExpired;
  const canSendMessages = hasActiveSessionNow && !communicationLoading;

  async function handleSend() {
    if (!text.trim() || !clientId || !user?.id || sending) return;
    if (!canSendMessages) {
      setError(
        sessionExpired
          ? "La sesion termino."
          : communicationAccess?.message ?? "Los mensajes estan disponibles solo durante una sesion activa.",
      );
      return;
    }

    const payloadText = text.trim();
    setText("");
    setInputHeight(44);

    try {
      setSending(true);
      const sent = await sendMessageToUser(clientId, payloadText);
      setMessages((prev) => [
        ...prev,
        {
          id: sent.id ?? `local-${Date.now()}`,
          senderId: user.id,
          text: sent.text ?? payloadText,
          createdAt: sent.createdAt ?? new Date().toISOString(),
        },
      ]);
      setError(null);
    } catch (err: any) {
      setText(payloadText);
      const message = err?.message ?? "No se pudo enviar el mensaje.";
      setError(message);
      if (
        String(message).toLowerCase().includes("sesion activa") ||
        String(message).toLowerCase().includes("sesión activa")
      ) {
        setCommunicationAccess((prev) => ({
          allowed: false,
          bookingId: prev?.bookingId ?? null,
          sessionStartsAt: prev?.sessionStartsAt ?? null,
          sessionEndsAt: prev?.sessionEndsAt ?? null,
          reason: prev?.reason ?? "UNKNOWN",
          message,
        }));
      }
    } finally {
      setSending(false);
    }
  }

  async function handleRequestCall(callType: "CALL" | "VIDEO_CALL") {
    if (requestingCall) return;
    if (!clientId) {
      Alert.alert("No se pudo iniciar la llamada", "No se encontró el cliente para esta conversación.");
      return;
    }

    try {
      const access = await getCommunicationAccess(clientId);
      setCommunicationAccess(access);
      if (!access.allowed) {
        Alert.alert("Llamada no disponible", access.message ?? "Las llamadas están disponibles solo durante una sesión activa.");
        return;
      }

      setRequestingCall(true);
      await startOutgoingCall({
        receiverId: clientId,
        receiverName: clientName,
        receiverAvatar: clientAvatar || null,
        callType,
      });
    } finally {
      setRequestingCall(false);
    }
  }

  const showEmpty = useMemo(() => !loading && messages.length === 0 && !error, [loading, messages.length, error]);
  const communicationHint = communicationLoading
    ? "Validando acceso a comunicacion..."
    : sessionExpired && canCommunicateByAccess
      ? "La sesion termino."
      : communicationAccess?.message ?? "Los mensajes estan disponibles solo durante una sesion activa.";

  return (
    <View style={styles.page}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={18} color={appTheme.colors.text} />
        </Pressable>
        <Image
          source={clientAvatar ? { uri: clientAvatar } : require("../../../../assets/no_image.jpg")}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {clientName}
          </Text>
          {hasActiveSessionNow ? (
            <Text style={styles.sub}>
              Sesion activa · termina en {formatRemainingMinText(sessionRemainingMs)}
            </Text>
          ) : (
            <Text style={styles.sub}>• Conversación</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.iconBtnMuted, requestingCall && styles.iconBtnMutedDisabled, !canSendMessages && styles.iconBtnMutedDisabled]}
            disabled={requestingCall || !canSendMessages}
            onPress={() => handleRequestCall("CALL")}
          >
            <Ionicons name="call" size={16} color="#C0267A" />
          </Pressable>
          <Pressable
            style={[styles.iconBtnMuted, requestingCall && styles.iconBtnMutedDisabled, !canSendMessages && styles.iconBtnMutedDisabled]}
            disabled={requestingCall || !canSendMessages}
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

      {!canSendMessages ? (
        <View style={styles.blockedBanner}>
          <Text style={styles.blockedBannerText}>{communicationHint}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.chatBody}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 6 : 0}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={appTheme.colors.success} />
            <Text style={styles.loading}>Cargando mensajes...</Text>
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
                    source={clientAvatar ? { uri: clientAvatar } : require("../../../../assets/no_image.jpg")}
                    style={styles.bubbleAvatar}
                  />
                ) : null}

                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.text}</Text>
                  <Text style={[styles.messageMeta, mine && styles.messageMetaMine]}>{formatMessageHour(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}> 
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Responder mensaje..."
            placeholderTextColor={appTheme.colors.textMuted}
            style={[styles.input, { height: Math.min(Math.max(inputHeight, 44), 120) }]}
            multiline
            editable={canSendMessages}
            maxLength={1200}
            onContentSizeChange={(event) => {
              setInputHeight(event.nativeEvent.contentSize.height + 16);
            }}
          />
          <Pressable
            style={[styles.sendButton, (!text.trim() || sending || !canSendMessages) && styles.sendButtonDisabled]}
            disabled={!text.trim() || sending || !canSendMessages}
            onPress={handleSend}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
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
  back: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtnMuted: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0EDF9",
  },
  iconBtnMutedDisabled: {
    opacity: 0.55,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  name: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 16,
    fontWeight: "700",
  },
  sub: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
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
  blockedBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  blockedBannerText: {
    color: "#92400E",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  chatBody: {
    flex: 1,
  },
  loadingWrap: {
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  loading: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
  },
  emptyWrap: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  timeSeparator: {
    alignSelf: "center",
    marginBottom: 10,
    color: "#94A3B8",
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
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
    backgroundColor: appTheme.colors.success,
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
    color: "rgba(255,255,255,0.9)",
  },
  inputBar: {
    paddingTop: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: "#EEF2F7",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D4DEE9",
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
    backgroundColor: appTheme.colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});

