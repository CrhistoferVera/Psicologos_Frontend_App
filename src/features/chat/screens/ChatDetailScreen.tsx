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
import { ArrowLeft } from "lucide-react-native";
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

export default function ChatDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    professionalId?: string | string[];
    professionalName?: string | string[];
    professionalAvatar?: string | string[];
  }>();
  const router = useRouter();
  const { user } = useAuth();
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
        // Wallet errors should not block chat view.
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

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={18} color={appTheme.colors.text} />
        </Pressable>
        <Image
          source={
            professionalAvatar
              ? { uri: professionalAvatar }
              : require("../../../../assets/no_image.jpg")
          }
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{professionalName}</Text>
          <Text style={styles.sub}>Chat privado</Text>
        </View>
        <View style={styles.balanceChip}>
          <Text style={styles.balanceText}>{balance.toFixed(0)} cr</Text>
        </View>
      </View>

      {lowBalance ? (
        <Pressable style={styles.warning} onPress={() => router.push("/(user)/credits" as any)}>
          <Text style={styles.warningText}>Saldo bajo. Toca aqui para recargar creditos.</Text>
        </Pressable>
      ) : null}
      {error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
            placeholder="Escribe un mensaje..."
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
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  balanceChip: {
    backgroundColor: "#E8F1FA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  balanceText: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.body,
    fontWeight: "700",
    fontSize: 12,
  },
  warning: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  warningText: {
    color: "#92400E",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
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
    backgroundColor: appTheme.colors.primary,
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
    backgroundColor: appTheme.colors.primary,
    borderRadius: 14,
    minWidth: 70,
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
