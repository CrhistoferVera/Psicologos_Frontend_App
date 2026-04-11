import ScreenHeader from '@/src/components/Menu/ScreenHeader';
import { useAuth } from '@/src/context/AuthContext';
import { anfitrionaChatScreenRef } from '@/src/services/notifications';
import { getChats, type Chat } from '@/src/api/messages';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const noImage = require('../../assets/no_image.jpg');

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function GoldAvatar({ name, avatar }: { name: string; avatar: string | null }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.avatarWrapper}>
      <Animated.View style={[styles.borderSpin, { transform: [{ rotate }] }]}>
        <LinearGradient
          colors={['#F6C16A', '#FFE5A0', '#C9933A', '#8B5E1A', '#F6C16A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <View style={styles.avatarInner}>
        <Image
          source={avatar ? { uri: avatar } : noImage}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

function ChatRow({ item, onPress }: { item: Chat; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <View style={styles.chatRow}>
        <GoldAvatar name={item.otherUserName} avatar={item.otherUserAvatar} />

        <View style={styles.chatInfo}>
          <View style={styles.chatRowTop}>
            <Text style={styles.chatName} numberOfLines={1}>{item.otherUserName}</Text>
            <Text style={styles.chatTime}>{timeAgo(item.lastMessageAt)}</Text>
          </View>

          <View style={styles.chatRowBottom}>
            <Text
              style={[styles.chatLastMsg, item.unreadCount > 0 && styles.chatLastMsgUnread]}
              numberOfLines={1}
            >
              {item.lastMessage ?? 'Nueva conversación'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>

          {item.unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>
                {item.unreadCount} mensaje{item.unreadCount !== 1 ? 's' : ''} sin leer
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.separator} />
    </TouchableOpacity>
  );
}

export default function AnfitrianaChats() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getChats(user.id);
      setChats(data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    anfitrionaChatScreenRef.current = true;
    return () => { anfitrionaChatScreenRef.current = false; };
  }, []);

  useEffect(() => { void loadChats(); }, [loadChats]);

  function openChat(chat: Chat) {
    router.push({
      pathname: '/(anfitriona)/chat/[conversationId]' as any,
      params: {
        conversationId: chat.conversationId,
        otherUserId: chat.otherUserId,
        otherUserName: chat.otherUserName,
        otherUserAvatar: chat.otherUserAvatar ?? '',
      },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0d0000' }}>
      <ScreenHeader title="Chats" role="anfitriona" />

      <LinearGradient
        colors={['#1a0000', '#0d0000']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F6C16A" />
        </View>
      ) : chats.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <MaterialCommunityIcons name="chat-outline" size={56} color="rgba(246,193,106,0.3)" />
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', marginTop: 16 }}>
            No tienes conversaciones aún.{'\n'}Los clientes te escribirán desde tu perfil.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.conversationId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void loadChats(); }}
              tintColor="#F6C16A"
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingTop: 8 }}
          renderItem={({ item }) => (
            <ChatRow item={item} onPress={() => openChat(item)} />
          )}
        />
      )}
    </View>
  );
}

const AVATAR_SIZE = 62;

const styles = StyleSheet.create({
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    padding: 2,
    position: 'relative',
  },
  borderSpin: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: '50%',
    left: '50%',
    marginTop: -150,
    marginLeft: -150,
  },
  avatarInner: {
    flex: 1,
    borderRadius: AVATAR_SIZE / 2 - 2,
    overflow: 'hidden',
    backgroundColor: '#1a0208',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  chatRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatLastMsg: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  chatLastMsgUnread: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#D11B1B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
  },
  unreadPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(209,27,27,0.2)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(209,27,27,0.5)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  unreadPillText: {
    color: '#ff6b6b',
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 16 + AVATAR_SIZE + 14,
  },
});
