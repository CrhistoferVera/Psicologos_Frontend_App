import { useAuth } from '@/src/context/AuthContext';
import { useCallSocket, type CallType } from '@/src/hooks/useCallSocket';
import { useAgoraCall } from '@/src/hooks/useAgoraCall';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { RtcSurfaceView, VideoSourceType } from '@/src/lib/agora';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

function uidFromUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (Math.imul(31, hash) + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100_000 || 1;
}

interface ControlBtnProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  activeColor?: string;
}

function ControlBtn({ icon, label, onPress, active, activeColor = '#dc2626' }: ControlBtnProps) {
  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', gap: 6, minWidth: 64 }}>
      <View style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: active ? activeColor : 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AnfitrianaCallScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { callId, callerId, callerName, callType, pricePerMinute } =
    useLocalSearchParams<{
      callId: string;
      callerId: string;
      callerName: string;
      callType: CallType;
      pricePerMinute: string;
    }>();

  const price   = Number(pricePerMinute ?? 0);
  const isVideo = callType === 'VIDEO_CALL';
  const uid     = user?.id ? uidFromUserId(user.id) : 0;

  const [seconds,  setSeconds]  = useState(0);
  const [ended,    setEnded]    = useState(false);
  const [billing,  setBilling]  = useState<{ creditsCharged: number } | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const controlsTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  const callSocket = useCallSocket(user?.id);
  const agora = useAgoraCall({ channelName: callId, uid, isVideo, enabled: true });

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

    const unsubEnded = callSocket.onCallEnded(() => {
      clearInterval(timerRef.current!);
      setEnded(true);
      agora.leave();
      setTimeout(() => router.back(), 3500);
    });
    const unsubBilled = callSocket.onCallBilled((data) => {
      setBilling({ creditsCharged: data.creditsCharged });
    });

    if (isVideo) scheduleHideControls();

    return () => { unsubEnded(); unsubBilled(); clearInterval(timerRef.current!); };
  }, []);

  function scheduleHideControls() {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    }, 4000);
  }

  function handleTapScreen() {
    if (!isVideo) return;
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    scheduleHideControls();
  }

  function handleHangUp() {
    callSocket.endCall(callId, callerId);
    agora.leave();
    clearInterval(timerRef.current!);
    // No navegamos de inmediato — esperamos el CALL_BILLED para mostrar el resumen
    setEnded(true);
    setTimeout(() => router.back(), 3500);
  }

  function formatTime(s: number) {
    const m   = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  const showVideoBackground = isVideo && agora.remoteUid !== null;
  const initial = (callerName ?? '?')[0].toUpperCase();

  return (
    <TouchableWithoutFeedback onPress={handleTapScreen}>
      <View style={{ flex: 1, backgroundColor: '#0d0d0d' }}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* ── Video remoto fondo ── */}
        {showVideoBackground && (
          <RtcSurfaceView
            canvas={{ uid: agora.remoteUid!, sourceType: VideoSourceType.VideoSourceRemote }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}

        {/* ── Fondo degradado (sin video) ── */}
        {!showVideoBackground && (
          <LinearGradient
            colors={isVideo ? ['#0a0a1a', '#0d0d0d'] : ['#0a1a2e', '#0d2040', '#0d0d0d']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}

        {/* ── Overlay inferior sobre video ── */}
        {showVideoBackground && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 }}
            pointerEvents="none"
          />
        )}

        {/* ── Video local PiP — aparece solo cuando el video remoto ya está cargado ── */}
        {isVideo && agora.remoteUid !== null && (
          <View style={{
            position: 'absolute',
            top: insets.top + 16,
            right: 16,
            width: 115,
            height: 165,
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: '#F6C16A',
            shadowColor: '#000',
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 10,
            zIndex: 10,
          }}>
            {/* RtcSurfaceView siempre montado — desmontarlo causa crash en Android
                ("child already has a parent"). El overlay controla la visibilidad. */}
            <RtcSurfaceView
              canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
              style={{ flex: 1 }}
            />
            {agora.cameraOff && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1a0208', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="videocam-off" size={28} color="rgba(255,255,255,0.5)" />
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Cámara apagada</Text>
              </View>
            )}
            <View style={{
              position: 'absolute', bottom: 6, left: 0, right: 0,
              alignItems: 'center',
            }}>
              <Text style={{
                color: 'white', fontSize: 10, fontWeight: '600',
                backgroundColor: 'rgba(0,0,0,0.45)',
                paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
              }}>Tú</Text>
            </View>
          </View>
        )}

        {/* ── UI superpuesta ── */}
        <Animated.View style={{ flex: 1, opacity: isVideo ? controlsOpacity : 1 }}>

          {showVideoBackground && (
            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }}
              pointerEvents="none"
            />
          )}

          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 28,
          }}>

            {/* ── Info del cliente ── */}
            <View style={{ alignItems: 'center', gap: 14 }}>
              {(!isVideo || agora.remoteUid === null) && (
                <View style={{
                  width: 140, height: 140, borderRadius: 70,
                  backgroundColor: '#1e3a5f',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
                }}>
                  <Text style={{ color: 'white', fontSize: 52, fontWeight: 'bold' }}>{initial}</Text>
                </View>
              )}

              <Text style={{ color: 'white', fontSize: 26, fontWeight: '700', textAlign: 'center' }}>
                {callerName}
              </Text>

              <View style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
                  <Text style={{ color: '#4ade80', fontSize: 14, fontWeight: '500' }}>
                    {isVideo ? 'Video llamada activa' : 'En llamada'}
                  </Text>
                </View>
                <Text style={{ color: '#e2e8f0', fontSize: 22, fontVariant: ['tabular-nums'], fontWeight: '300', letterSpacing: 2 }}>
                  {formatTime(seconds)}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  {price} crédito{price !== 1 ? 's' : ''}/min · tus ganancias
                </Text>
              </View>
            </View>

            <View />

            {/* ── Controles ── */}
            <View style={{ alignItems: 'center', gap: 24, paddingHorizontal: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
                <ControlBtn
                  icon={agora.muted ? 'mic-off' : 'mic'}
                  label={agora.muted ? 'Activar mic' : 'Silenciar'}
                  onPress={agora.toggleMute}
                  active={agora.muted}
                />
                <ControlBtn
                  icon={agora.speakerOn ? 'volume-high' : 'volume-medium'}
                  label={agora.speakerOn ? 'Auricular' : 'Altavoz'}
                  onPress={agora.toggleSpeaker}
                  active={agora.speakerOn}
                  activeColor="#2563eb"
                />
                {isVideo && (
                  <>
                    <ControlBtn
                      icon={agora.cameraOff ? 'videocam-off' : 'videocam'}
                      label={agora.cameraOff ? 'Activar cám' : 'Apagar cám'}
                      onPress={agora.toggleCamera}
                      active={agora.cameraOff}
                    />
                    <ControlBtn
                      icon="camera-reverse"
                      label="Girar"
                      onPress={agora.switchCamera}
                    />
                  </>
                )}
              </View>

              <TouchableOpacity
                onPress={handleHangUp}
                activeOpacity={0.8}
                style={{
                  width: 72, height: 72, borderRadius: 36,
                  backgroundColor: '#dc2626',
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#dc2626', shadowOpacity: 0.5,
                  shadowRadius: 12, elevation: 8,
                }}
              >
                <Ionicons name="call" size={30} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ── Overlay fin de llamada ── */}
        {ended && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Ionicons name="call" size={48} color="#ef4444" style={{ transform: [{ rotate: '135deg' }] }} />
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginTop: 8 }}>
              Llamada finalizada
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              Duración: {formatTime(seconds)}
            </Text>
            {billing && billing.creditsCharged > 0 && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(74,222,128,0.15)',
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: 20, marginTop: 4,
                borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
              }}>
                <Ionicons name="wallet-outline" size={16} color="#4ade80" />
                <Text style={{ color: '#4ade80', fontSize: 14, fontWeight: '600' }}>
                  +{billing.creditsCharged} crédito{billing.creditsCharged !== 1 ? 's' : ''} ganados
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
