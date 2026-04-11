import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Text, TouchableOpacity, View } from "react-native";
import BottomNav from "@/src/components/Menu/BottomNav";
import { useAuth } from "@/src/context/AuthContext";
import { useCallSocket, type IncomingCallData } from "@/src/hooks/useCallSocket";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { onCallKeepAnswer, onCallKeepEnd, removeCallKeepListeners, endCallKeep } from "@/src/services/callkeep";

function PulseRing({ size, delay }: { size: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1400, useNativeDriver: true }),
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
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 2,
        borderColor: 'rgba(74,222,128,0.7)',
        opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 0.2, 0] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] }) }],
      }}
    />
  );
}

export default function AnfitrianaLayout() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useAuth();

  const hideNav =
    pathname.includes("/chat/") ||
    pathname.includes("/precios") ||
    pathname.includes("/call") ||

    pathname.includes("/vista-previa") ||
    pathname.includes("/terminos");

  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const callSocket = useCallSocket(user?.id);
  // Guardamos los datos de la llamada en un ref para usarlos cuando acepta desde CallKeep
  const pendingCallRef = useRef<IncomingCallData | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = callSocket.onIncomingCall((data) => {
      setIncomingCall(data);
      pendingCallRef.current = data; // guardamos los datos para CallKeep
    });

    // Escuchar cuando el usuario acepta desde la pantalla nativa de CallKeep
    onCallKeepAnswer((callId) => {
      const data = pendingCallRef.current;
      endCallKeep(callId);
      router.push({
        pathname: '/(anfitriona)/call' as any,
        params: {
          callId,
          callerId:       data?.callerId       ?? '',
          callerName:     data?.callerName     ?? 'Cliente',
          callType:       data?.callType       ?? 'CALL',
          pricePerMinute: String(data?.pricePerMinute ?? 0),
        },
      });
      pendingCallRef.current = null;
    });

    // Escuchar cuando el usuario rechaza desde la pantalla nativa de CallKeep
    onCallKeepEnd((callId) => {
      const data = pendingCallRef.current;
      endCallKeep(callId);
      callSocket.rejectCall(callId, data?.callerId ?? '');
      pendingCallRef.current = null;
    });

    return () => {
      unsub();
      removeCallKeepListeners();
    };
  }, [user?.id]);

  // Animar entrada del modal
  useEffect(() => {
    if (incomingCall) {
      Animated.spring(slideAnim, {
        toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(600);
    }
  }, [incomingCall]);

  function handleAccept() {
    if (!incomingCall) return;
    callSocket.acceptCall(incomingCall.callId, incomingCall.callerId);
    const data = incomingCall;
    setIncomingCall(null);
    router.push({
      pathname: '/(anfitriona)/call' as any,
      params: {
        callId: data.callId,
        callerId: data.callerId,
        callerName: data.callerName,
        callType: data.callType,
        pricePerMinute: String(data.pricePerMinute),
      },
    });
  }

  function handleReject() {
    if (!incomingCall) return;
    callSocket.rejectCall(incomingCall.callId, incomingCall.callerId);
    Animated.timing(slideAnim, { toValue: 600, duration: 300, useNativeDriver: true }).start(() => {
      setIncomingCall(null);
    });
  }

  const isVideo  = incomingCall?.callType === 'VIDEO_CALL';
  const initial  = (incomingCall?.callerName ?? '?')[0].toUpperCase();

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {!hideNav && <BottomNav role="anfitriona" />}

      {/* ── Modal llamada entrante ── */}
      <Modal
        visible={!!incomingCall}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>

          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <LinearGradient
              colors={isVideo ? ['#0a1a2e', '#081520'] : ['#0f1a10', '#081008']}
              style={{
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                paddingTop: 12,
                paddingBottom: 40,
                paddingHorizontal: 28,
                alignItems: 'center',
              }}
            >
              {/* Handle bar */}
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 28 }} />

              {/* Tipo de llamada */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <Ionicons
                  name={isVideo ? 'videocam' : 'call'}
                  size={18}
                  color="rgba(255,255,255,0.6)"
                />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, letterSpacing: 0.5 }}>
                  {isVideo ? 'Video llamada entrante' : 'Llamada entrante'}
                </Text>
              </View>

              {/* Avatar con anillos */}
              <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <PulseRing size={120} delay={0} />
                <PulseRing size={120} delay={500} />
                <View style={{
                  width: 120, height: 120, borderRadius: 60,
                  backgroundColor: '#1e3a5f',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 3, borderColor: 'rgba(74,222,128,0.5)',
                }}>
                  <Text style={{ color: 'white', fontSize: 46, fontWeight: 'bold' }}>{initial}</Text>
                </View>
              </View>

              {/* Nombre */}
              <Text style={{ color: 'white', fontSize: 26, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>
                {incomingCall?.callerName ?? 'Cliente'}
              </Text>

              {/* Precio */}
              {!!incomingCall?.pricePerMinute && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: 'rgba(74,222,128,0.15)',
                  paddingHorizontal: 14, paddingVertical: 6,
                  borderRadius: 20, marginBottom: 36,
                }}>
                  <Ionicons name="cash-outline" size={14} color="#4ade80" />
                  <Text style={{ color: '#4ade80', fontSize: 13, fontWeight: '600' }}>
                    {incomingCall.pricePerMinute} crédito{incomingCall.pricePerMinute !== 1 ? 's' : ''}/min · tus ganancias
                  </Text>
                </View>
              )}

              {/* Botones */}
              <View style={{ flexDirection: 'row', gap: 48, alignItems: 'center' }}>

                {/* Rechazar */}
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    onPress={handleReject}
                    activeOpacity={0.8}
                    style={{
                      width: 72, height: 72, borderRadius: 36,
                      backgroundColor: '#dc2626',
                      alignItems: 'center', justifyContent: 'center',
                      shadowColor: '#dc2626', shadowOpacity: 0.5,
                      shadowRadius: 10, elevation: 6,
                    }}
                  >
                    <Ionicons name="call" size={28} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                  </TouchableOpacity>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Rechazar</Text>
                </View>

                {/* Aceptar */}
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    onPress={handleAccept}
                    activeOpacity={0.8}
                    style={{
                      width: 72, height: 72, borderRadius: 36,
                      backgroundColor: '#16a34a',
                      alignItems: 'center', justifyContent: 'center',
                      shadowColor: '#16a34a', shadowOpacity: 0.5,
                      shadowRadius: 10, elevation: 6,
                    }}
                  >
                    <Ionicons name={isVideo ? 'videocam' : 'call'} size={28} color="white" />
                  </TouchableOpacity>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Aceptar</Text>
                </View>

              </View>
            </LinearGradient>
          </Animated.View>

        </View>
      </Modal>
    </View>
  );
}
