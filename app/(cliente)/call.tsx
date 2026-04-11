import { useAuth } from '@/src/context/AuthContext';
import { useCallSocket, type CallType } from '@/src/hooks/useCallSocket';
import { useAgoraCall } from '@/src/hooks/useAgoraCall';
import { apiGetMyWallet } from '@/src/api/userClient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { RtcSurfaceView, VideoSourceType } from 'react-native-agora';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type CallState = 'ringing' | 'connected' | 'rejected' | 'ended';

function uidFromUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (Math.imul(31, hash) + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100_000 || 1;
}

/** Anillo pulsante animado */
function PulseRing({ size, delay, color }: { size: number; delay: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
      }}
    />
  );
}

/** Puntos animados "Llamando..." */
function AnimatedDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800),
        ]),
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const dot = (val: Animated.Value) => (
    <Animated.Text style={{ color: 'white', fontSize: 18, opacity: val, marginHorizontal: 2 }}>•</Animated.Text>
  );

  return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{dot(dot1)}{dot(dot2)}{dot(dot3)}</View>;
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

export default function ClientCallScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    anfitrionaId,
    anfitrionaName,
    anfitrionaAvatar,
    callType,
    pricePerMinute,
    callId: paramCallId,
  } = useLocalSearchParams<{
    anfitrionaId: string;
    anfitrionaName: string;
    anfitrionaAvatar: string;
    callType: CallType;
    pricePerMinute: string;
    callId: string;
  }>();

  const callId   = paramCallId ?? `${user?.id}_${Date.now()}`;
  const price    = Number(pricePerMinute ?? 0);
  const isVideo  = callType === 'VIDEO_CALL';
  const uid      = user?.id ? uidFromUserId(user.id) : 0;

  const [callState,    setCallState]    = useState<CallState>('ringing');
  const [seconds,      setSeconds]      = useState(0);
  const [billing,      setBilling]      = useState<{ creditsCharged: number; minutesBilled: number } | null>(null);
  const [, setControlsVisible] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  const callSocket = useCallSocket(user?.id);
  const agora = useAgoraCall({ channelName: callId, uid, isVideo, enabled: callState === 'connected' });

  const callEndedRef = useRef(false);

  useEffect(() => {
    if (!user?.id || !anfitrionaId) return;

    let active = true;
    const unsubs: Array<() => void> = [];

    const endCallNow = (reason: string) => {
      if (callEndedRef.current) return;
      callEndedRef.current = true;
      callSocket.endCall(callId, anfitrionaId);
      agora.leave();
      clearInterval(timerRef.current!);
      Toast.show({ type: 'error', text1: 'Llamada finalizada', text2: reason, position: 'top', visibilityTime: 4000, topOffset: 60 });
      setCallState('ended');
      setTimeout(() => router.back(), 3500);
    };

    const setupListeners = () => {
      callSocket.requestCall({
        callId,
        callerId: user.id,
        receiverId: anfitrionaId,
        callType: callType as CallType,
        callerName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Cliente',
        callerAvatar: null,
        pricePerMinute: price,
      });

      unsubs.push(
        callSocket.onCallAccepted(() => {
          setCallState('connected');
          timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
        }),
        callSocket.onCallRejected(() => {
          setCallState('rejected');
          setTimeout(() => router.back(), 2500);
        }),
        callSocket.onCallEnded(() => {
          callEndedRef.current = true;
          setCallState('ended');
          clearInterval(timerRef.current!);
          agora.leave();
          setTimeout(() => router.back(), 3500);
        }),
        callSocket.onCallBilled((data) => {
          setBilling({ creditsCharged: data.creditsCharged, minutesBilled: data.minutesBilled });
        }),
        callSocket.onCallWarning((data) => {
          if (data.balance <= 0) {
            endCallNow('Se agotaron tus créditos');
          } else {
            Toast.show({
              type: 'error',
              text1: '⚠️ Saldo bajo',
              text2: `Te quedan ${data.balance} crédito${data.balance !== 1 ? 's' : ''}`,
              position: 'top',
              visibilityTime: 4000,
              topOffset: 60,
            });
          }
        }),
      );
    };

    apiGetMyWallet()
      .then((wallet) => {
        if (!active) return;
        if (price > 0 && wallet.balance < price) {
          Toast.show({
            type: 'error',
            text1: 'Saldo insuficiente',
            text2: `Necesitas al menos ${price} crédito${price !== 1 ? 's' : ''} para llamar`,
            position: 'top',
            visibilityTime: 3500,
            topOffset: 60,
          });
          setTimeout(() => router.back(), 2500);
          return;
        }
        setupListeners();
      })
      .catch(() => {
        if (active) setupListeners();
      });

    return () => {
      active = false;
      unsubs.forEach((u) => u());
      clearInterval(timerRef.current!);
    };
  }, [user?.id]);

  // Auto-ocultar controles en videollamada
  useEffect(() => {
    if (isVideo && callState === 'connected') scheduleHideControls();
  }, [callState]);

  function scheduleHideControls() {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      setControlsVisible(false);
    }, 4000);
  }

  function handleTapScreen() {
    if (!isVideo || callState !== 'connected') return;
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    setControlsVisible(true);
    scheduleHideControls();
  }

  function handleHangUp() {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    callSocket.endCall(callId, anfitrionaId);
    agora.leave();
    clearInterval(timerRef.current!);
    // No navegamos de inmediato — esperamos el CALL_BILLED para mostrar el resumen
    setCallState('ended');
    setTimeout(() => router.back(), 3500);
  }

  function formatTime(s: number) {
    const m   = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  const showVideoBackground = isVideo && callState === 'connected' && agora.remoteUid !== null;
  const showEndedOverlay    = callState === 'rejected' || callState === 'ended';
  const showAvatar          = !isVideo || callState !== 'connected';

  return (
    <TouchableWithoutFeedback onPress={handleTapScreen}>
      <View style={{ flex: 1, backgroundColor: '#0d0d0d' }}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* ── Video remoto (fondo) ── */}
        {showVideoBackground && (
          <RtcSurfaceView
            canvas={{ uid: agora.remoteUid!, sourceType: VideoSourceType.VideoSourceRemote }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}

        {/* ── Fondo degradado (llamada de voz o sin video aún) ── */}
        {!showVideoBackground && (
          <LinearGradient
            colors={isVideo ? ['#0a0a1a', '#0d0d0d'] : ['#1a0a2e', '#0d1a2e', '#0d0d0d']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}

        {/* ── Overlay gradiente inferior (legibilidad controles sobre video) ── */}
        {showVideoBackground && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 }}
            pointerEvents="none"
          />
        )}

        {/* ── Video local PiP — aparece solo cuando el video remoto ya está cargado ── */}
        {isVideo && callState === 'connected' && agora.remoteUid !== null && (
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

        {/* ── Overlay UI (controles + info) ── */}
        <Animated.View
          style={{
            flex: 1,
            opacity: isVideo && callState === 'connected' ? controlsOpacity : 1,
          }}
        >
          {/* Gradiente superior sobre video */}
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

            {/* ── Bloque superior: avatar + nombre + estado ── */}
            <View style={{ alignItems: 'center', gap: 14 }}>
              {showAvatar && (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {callState === 'ringing' && (
                    <>
                      <PulseRing size={160} delay={0}    color="rgba(168,85,247,0.6)" />
                      <PulseRing size={160} delay={500}  color="rgba(168,85,247,0.4)" />
                      <PulseRing size={160} delay={1000} color="rgba(168,85,247,0.2)" />
                    </>
                  )}
                  {anfitrionaAvatar ? (
                    <Image
                      source={{ uri: anfitrionaAvatar }}
                      style={{
                        width: 140, height: 140, borderRadius: 70,
                        borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
                      }}
                    />
                  ) : (
                    <View style={{
                      width: 140, height: 140, borderRadius: 70,
                      backgroundColor: '#6b21a8',
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
                    }}>
                      <Text style={{ color: 'white', fontSize: 52, fontWeight: 'bold' }}>
                        {(anfitrionaName ?? '?')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={{ color: 'white', fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: showAvatar ? 0 : insets.top }}>
                {anfitrionaName}
              </Text>

              {/* Estado dinámico */}
              {callState === 'ringing' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>Llamando</Text>
                  <AnimatedDots />
                </View>
              )}

              {callState === 'connected' && (
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
                    {price} crédito{price !== 1 ? 's' : ''}/min
                  </Text>
                </View>
              )}
            </View>

            {/* Spacer */}
            <View />

            {/* ── Controles inferiores ── */}
            <View style={{ alignItems: 'center', gap: 24, width: '100%', paddingHorizontal: 24 }}>
              {callState === 'connected' && (
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
              )}

              {/* Botón colgar */}
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
        {showEndedOverlay && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Ionicons name="call" size={48} color="#ef4444" style={{ transform: [{ rotate: '135deg' }] }} />
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '600', marginTop: 8 }}>
              {callState === 'rejected' ? 'Llamada rechazada' : 'Llamada finalizada'}
            </Text>
            {seconds > 0 && (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                Duración: {formatTime(seconds)}
              </Text>
            )}
            {billing && billing.creditsCharged > 0 && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(220,38,38,0.2)',
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: 20, marginTop: 4,
                borderWidth: 1, borderColor: 'rgba(220,38,38,0.4)',
              }}>
                <Ionicons name="wallet-outline" size={16} color="#f87171" />
                <Text style={{ color: '#f87171', fontSize: 14, fontWeight: '600' }}>
                  -{billing.creditsCharged} crédito{billing.creditsCharged !== 1 ? 's' : ''} cobrados
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
