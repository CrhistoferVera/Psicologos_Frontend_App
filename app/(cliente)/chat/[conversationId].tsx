import { useAuth } from '@/src/context/AuthContext';
import { activeChatRef } from '@/src/services/notifications';
import {
  getMessages,
  markAsRead,
  sendMessageHttp,
  unlockMessage,
  type Message,
} from '@/src/api/messages';
import { apiGetPublicServicePrices, type ServicePrice } from '@/src/api/servicePrices';
import { useSocket } from '@/src/hooks/useSocket';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  FlatList,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateSeparator(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
}

export default function ChatScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const { conversationId, otherUserId, otherUserName, otherUserAvatar } =
    useLocalSearchParams<{
      conversationId: string;
      otherUserId: string;
      otherUserName: string;
      otherUserAvatar: string;
    }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState(
    conversationId !== 'new' ? conversationId : null,
  );
  const [kavKey, setKavKey] = useState(0);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!otherUserId) return;
    apiGetPublicServicePrices(otherUserId)
      .then(setServicePrices)
      .catch(() => {});
  }, [otherUserId]);

  function getPrice(type: ServicePrice['serviceType']) {
    return servicePrices.find((p) => p.serviceType === type)?.price ?? null;
  }

  function handleCall(callType: 'CALL' | 'VIDEO_CALL') {
    const price = getPrice(callType);
    if (price === null) return;
    router.push({
      pathname: '/(cliente)/call' as any,
      params: {
        anfitrionaId: otherUserId,
        anfitrionaName: otherUserName,
        anfitrionaAvatar: otherUserAvatar ?? '',
        callType,
        pricePerMinute: String(price),
        callId: `${user?.id}_${Date.now()}`,
      },
    });
  }

  function goToProfile() {
    if (!otherUserId) return;
    router.push({
      pathname: '/(cliente)/anfitrionas/[id]/verperfil' as any,
      params: { id: otherUserId },
    });
  }

  const { onNewMessage } = useSocket(user?.id);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') setKavKey((k) => k + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!activeConversationId) { setLoading(false); return; }
    void loadMessages();
  }, [activeConversationId]);

  useEffect(() => {
    const unsub = onNewMessage((msg) => {
      if (msg.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToEnd();
      }
    });
    return unsub;
  }, [activeConversationId]);

  useEffect(() => {
    if (activeConversationId) activeChatRef.current = activeConversationId;
    return () => { activeChatRef.current = null; };
  }, [activeConversationId]);

  useEffect(() => {
    if (activeConversationId && user?.id) void markAsRead(activeConversationId, user.id);
  }, [activeConversationId]);

  async function loadMessages() {
    if (!activeConversationId) return;
    try {
      const data = await getMessages(activeConversationId);
      setMessages(data);
      setTimeout(() => scrollToEnd(), 100);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  function scrollToEnd() {
    listRef.current?.scrollToEnd({ animated: true });
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !user?.id || !otherUserId || sending) return;
    setText('');
    setSending(true);

    // Mensaje optimista: aparece inmediatamente en la lista con ID temporal
    const tempId = `_pending_${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      conversationId: activeConversationId ?? '',
      senderId: user.id,
      text: trimmed,
      read: false,
      isLocked: false,
      price: null,
      isUnlocked: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    scrollToEnd();

    try {
      const msg = await sendMessageHttp(user.id, otherUserId, trimmed);
      // Reemplazar el mensaje temporal con el real del servidor
      setMessages((prev) => prev.map((m) => m.id === tempId ? msg : m));
      setActiveConversationId(msg.conversationId);
    } catch (e: any) {
      setText(trimmed);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const msg = e?.message ?? '';
      if (msg.toLowerCase().includes('créditos')) {
        Alert.alert('Sin créditos', 'No tienes créditos suficientes para enviar mensajes. Recarga tu cuenta.');
      }
    } finally {
      setSending(false);
    }
  }

  async function handleUnlock(messageId: string, price: number) {
    Alert.alert(
      'Abrir regalo',
      `¿Quieres abrir este regalo por ${price} crédito${price !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: `Abrir regalo (${price} créditos)`,
          onPress: async () => {
            setUnlocking(messageId);
            try {
              const result = await unlockMessage(messageId);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === messageId
                    ? { ...m, text: result.text, isLocked: false, isUnlocked: true }
                    : m,
                ),
              );
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo abrir el regalo');
            } finally {
              setUnlocking(null);
            }
          },
        },
      ],
    );
  }

  const msgPrice = getPrice('MESSAGE_SEND' as ServicePrice['serviceType']);

  const EMOJIS = [
    '😀','😂','🥰','😍','😘','😋','🤩','😊','😏','🥺',
    '😭','😤','🤣','🙄','💀','🔥','💯','👀','😈','🤦',
    '❤️','🧡','💛','💚','💙','💜','💕','💋','🫶','🙏',
    '👋','👍','🙌','💪','🎉','🌹','🌸','✨','💫','⭐',
  ];

  function insertEmoji(emoji: string) {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  }

  function toggleEmoji() {
    setShowEmoji((v) => !v);
    if (showEmoji) {
      inputRef.current?.focus();
    }
  }

  // Agrupar mensajes con separadores de fecha
  type ListItem = Message | { type: 'separator'; label: string; key: string };

  const listData: ListItem[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const day = new Date(msg.createdAt).toDateString();
    if (day !== lastDate) {
      listData.push({ type: 'separator', label: formatDateSeparator(msg.createdAt), key: `sep-${day}` });
      lastDate = day;
    }
    listData.push(msg);
  }

  return (
    <View className="flex-1 bg-[#0a0000]">
      <Stack.Screen options={{ headerShown: false }} />

  
      <View
        className="flex-row items-center bg-[#140008] border-b border-[rgba(246,193,106,0.12)] pb-4 px-[14px] gap-[10px]"
        style={{ paddingTop: insets.top + 10 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>

        
        <TouchableOpacity onPress={goToProfile} className="flex-1 flex-row items-center gap-3" activeOpacity={0.75}>
          <View className="w-12 h-12 rounded-full border-2 border-[#F6C16A] overflow-hidden">
            {otherUserAvatar ? (
              <Image source={{ uri: otherUserAvatar }} className="w-full h-full" />
            ) : (
              <View className="flex-1 bg-[#2a0810] items-center justify-center">
                <Text className="text-[#F6C16A] font-bold text-lg">
                  {(otherUserName ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold" numberOfLines={1}>{otherUserName ?? 'Chat'}</Text>
            <Text className="text-[rgba(246,193,106,0.6)] text-xs mt-0.5">Ver perfil</Text>
          </View>
        </TouchableOpacity>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleCall('CALL')}
            disabled={getPrice('CALL') === null}
            activeOpacity={0.7}
            className="w-[38px] h-[38px] rounded-full bg-[rgba(255,255,255,0.07)] items-center justify-center"
            style={getPrice('CALL') === null ? { opacity: 0.35 } : undefined}
          >
            <Ionicons name="call" size={18} color="#4ade80" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleCall('VIDEO_CALL')}
            disabled={getPrice('VIDEO_CALL') === null}
            activeOpacity={0.7}
            className="w-[38px] h-[38px] rounded-full bg-[rgba(255,255,255,0.07)] items-center justify-center"
            style={getPrice('VIDEO_CALL') === null ? { opacity: 0.35 } : undefined}
          >
            <Ionicons name="videocam" size={20} color="#818cf8" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView key={kavKey} className="flex-1" behavior="padding" keyboardVerticalOffset={0}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#F6C16A" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={listData}
            keyExtractor={(item) => ('id' in item ? item.id : item.key)}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, paddingBottom: 6 }}
            onContentSizeChange={scrollToEnd}
            ListEmptyComponent={
              <View className="items-center mt-16">
                <Text className="text-[rgba(255,255,255,0.3)] text-sm">Inicia la conversación</Text>
              </View>
            }
            renderItem={({ item }) => {
              // Separador de fecha
              if ('type' in item && item.type === 'separator') {
                return (
                  <View className="flex-row items-center my-[14px] gap-2">
                    <View className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
                    <Text className="text-[rgba(255,255,255,0.35)] text-[11px] font-medium">{item.label}</Text>
                    <View className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
                  </View>
                );
              }

              const msg = item as Message;
              const isOwn = msg.senderId === user?.id;
              const lockedAndNotUnlocked = msg.isLocked && !isOwn && !msg.isUnlocked;

              return (
                <View className={`mb-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                  {lockedAndNotUnlocked ? (
                    <View
                      className="max-w-[78%] bg-[#1a0208] rounded-[18px] rounded-bl-[4px] border border-[rgba(209,27,27,0.6)] px-[14px] py-3"
                      style={{
                        shadowColor: '#D11B1B',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.4,
                        shadowRadius: 10,
                        elevation: 4,
                      }}
                    >
                      <View className="flex-row items-center gap-[6px] mb-[6px]">
                        <Text className="text-lg">🎁</Text>
                        <Text className="text-[rgba(246,193,106,0.9)] text-[13px] font-bold">Regalo exclusivo</Text>
                      </View>
                      {msg.price != null && (
                        <Text className="text-[rgba(255,255,255,0.45)] text-xs mb-[10px] leading-4" numberOfLines={2}>
                          Abre este regalo para ver el mensaje
                        </Text>
                      )}
                      <TouchableOpacity
                        onPress={() => handleUnlock(msg.id, msg.price!)}
                        disabled={unlocking === msg.id}
                        className="bg-[#D11B1B] rounded-xl py-2 px-[14px] items-center"
                      >
                        {unlocking === msg.id ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-white text-xs font-bold">
                            Abrir regalo por {msg.price} crédito{msg.price !== 1 ? 's' : ''}
                          </Text>
                        )}
                      </TouchableOpacity>
                      <Text className="text-[rgba(255,255,255,0.3)] text-[10px] mt-[6px] text-right">{formatTime(msg.createdAt)}</Text>
                    </View>
                  ) : (
                    <View
                      className={`max-w-[78%] rounded-[18px] px-[14px] py-2 ${
                        isOwn
                          ? 'bg-[#8B1030] rounded-br-[4px]'
                          : 'bg-[#1e1010] rounded-bl-[4px]'
                      }`}
                    >
                      {msg.isUnlocked && (
                        <Text className="text-[#F6C16A] text-[10px] mb-[3px]">🎁 Regalo abierto</Text>
                      )}
                      <Text className="text-white text-[15px] leading-[21px]">{msg.text}</Text>
                      {isOwn ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 3 }}>
                          <Text className="text-[10px] text-[rgba(255,200,200,0.6)]">{formatTime(msg.createdAt)}</Text>
                          {msg.id.startsWith('_pending_') ? (
                            <Ionicons name="time-outline" size={10} color="rgba(255,200,200,0.4)" />
                          ) : msg.read ? (
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' }}>✓✓</Text>
                          ) : (
                            <Text style={{ color: 'rgba(255,200,200,0.55)', fontSize: 11, fontWeight: '700' }}>✓</Text>
                          )}
                        </View>
                      ) : (
                        <Text className="text-[10px] mt-[3px] text-right text-[rgba(255,255,255,0.35)]">
                          {formatTime(msg.createdAt)}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}

        {/* Emoji picker panel */}
        {showEmoji && (
          <View className="bg-[#140008] border-t border-[rgba(246,193,106,0.1)] py-2 px-[6px]">
            <ScrollView horizontal={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 140 }}>
              <View className="flex-row flex-wrap gap-[2px]">
                {EMOJIS.map((e) => (
                  <TouchableOpacity key={e} onPress={() => insertEmoji(e)} className="p-[6px] rounded-lg">
                    <Text className="text-2xl">{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Input bar */}
        <View
          className="flex-row items-center bg-[#140008] border-t border-[rgba(246,193,106,0.1)] px-[10px] pt-[10px] gap-[6px]"
          style={{ paddingBottom: insets.bottom + 10 }}
        >
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onFocus={() => setShowEmoji(false)}
            placeholder={msgPrice != null ? `Enviar mensaje – ${msgPrice} cr.` : 'Escribe un mensaje...'}
            placeholderTextColor="rgba(246,193,106,0.5)"
            multiline
            className="flex-1 bg-[#1a0208] text-white rounded-[22px] px-[14px] py-[10px] text-sm border border-[rgba(246,193,106,0.18)]"
            style={{ maxHeight: 100 }}
          />

          <TouchableOpacity className="p-1" onPress={toggleEmoji}>
            <Ionicons
              name={showEmoji ? 'happy' : 'happy-outline'}
              size={22}
              color={showEmoji ? '#F6C16A' : 'rgba(255,255,255,0.45)'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: text.trim() ? '#D11B1B' : 'rgba(209,27,27,0.3)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-up" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
