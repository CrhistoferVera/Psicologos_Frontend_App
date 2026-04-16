import { useEffect, useState } from "react";
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
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "../../../context/AuthContext";
import { appTheme } from "../../../theme/appTheme";
import { getMessages, markConversationAsRead, sendMessageToUser, type Message } from "../../../api/messages";

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

export default function ProfessionalMessageDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    clientId?: string | string[];
    clientName?: string | string[];
    clientAvatar?: string | string[];
  }>();

  const router = useRouter();
  const { user } = useAuth();

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

  async function handleSend() {
    if (!text.trim() || !clientId || !user?.id) return;
    const payloadText = text.trim();
    setText("");

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
    } catch (err: any) {
      setText(payloadText);
      setError(err?.message ?? "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={18} color={appTheme.colors.text} />
        </Pressable>
        <Image
          source={clientAvatar ? { uri: clientAvatar } : require("../../../../assets/no_image.jpg")}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{clientName}</Text>
          <Text style={styles.sub}>Conversacion profesional</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {loading ? <Text style={styles.loading}>Cargando mensajes...</Text> : null}

        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.messageText, mine && { color: "#FFFFFF" }]}>{item.text}</Text>
              </View>
            );
          }}
        />

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Responder mensaje..."
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
          />
          <Pressable style={[styles.sendButton, sending && { opacity: 0.6 }]} disabled={sending} onPress={handleSend}>
            <Text style={styles.sendLabel}>Enviar</Text>
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
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: appTheme.colors.surface,
  },
  back: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E2E8F0",
  },
  name: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
  sub: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
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
  loading: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
  messages: {
    padding: 14,
    gap: 8,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: appTheme.colors.success,
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: appTheme.colors.surface,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  messageText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  inputBar: {
    padding: 10,
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    paddingHorizontal: 12,
    color: appTheme.colors.text,
    minHeight: 44,
    fontFamily: appTheme.fonts.body,
  },
  sendButton: {
    backgroundColor: appTheme.colors.success,
    borderRadius: 14,
    minWidth: 76,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  sendLabel: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
  },
});
