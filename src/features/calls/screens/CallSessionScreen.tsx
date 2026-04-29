import { useEffect, useRef, useState } from "react";
import { useCallDuration } from "../../../hooks/useCallDuration";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Animated,
  PanResponder,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appTheme } from "../../../theme/appTheme";
import { useCallManager } from "../../../context/CallContext";
import { useAuth } from "../../../context/AuthContext";
import { getAgoraToken } from "../../../api/calls";
import {
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
  createAgoraRtcEngine,
  type IRtcEngine,
  type IRtcEngineEventHandler,
} from "../../../lib/agora";

function toNumericUid(id: string | number): number {
  const n = Number(String(id).replace(/\D/g, "").slice(0, 9));
  return n || Math.floor(Math.random() * 1_000_000);
}

function resolveVideoSourceType(keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = (VideoSourceType as any)?.[key];
    if (typeof value === "number") return value;
  }
  return fallback;
}

export default function CallSessionScreen() {
  const params = useLocalSearchParams<{ callId?: string | string[] }>();
  const router = useRouter();
  const { getSession, endCall } = useCallManager();
  const { user } = useAuth();

  const rawCallId = Array.isArray(params.callId) ? params.callId[0] : (params.callId ?? "");
  const session = rawCallId ? getSession(rawCallId) : null;
  const isVideoCall = session?.callType === "VIDEO_CALL";

  const engineRef = useRef<IRtcEngine | null>(null);
  const eventsRef = useRef<IRtcEngineEventHandler | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);

  const [agoraConnectedAt, setAgoraConnectedAt] = useState<number | null>(null);
  const hasConnectedRef = useRef(false);
  const durationLabel = useCallDuration(agoraConnectedAt);

  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [cameraMuted, setCameraMuted] = useState(false);

  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pipAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pipPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pipAnim.x, dy: pipAnim.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => pipAnim.extractOffset(),
    }),
  ).current;

  const srcLocal = resolveVideoSourceType(["VideoSourceCameraPrimary", "VideoSourceCamera"], 0);
  const srcRemote = resolveVideoSourceType(["VideoSourceRemote"], 9);

  const showControls = () => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 4500);
  };

  useEffect(() => {
    if (isVideoCall && session?.status === "connected") showControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isVideoCall, session?.status]);

  useEffect(() => {
    if (!session || session.status !== "connected" || !user?.id) return;

    let cancelled = false;
    const engine = createAgoraRtcEngine();
    engineRef.current = engine;

    setEngineReady(false);
    setChannelError(null);
    setRemoteUid(null);
    setCameraMuted(false);
    setMuted(false);
    setSpeakerOn(true);

    const numericUid = toNumericUid(user.id);

    const events: IRtcEngineEventHandler = {
      onJoinChannelSuccess: () => {
        if (cancelled) return;
        setEngineReady(true);
        if (!hasConnectedRef.current) {
          hasConnectedRef.current = true;
          setAgoraConnectedAt(Date.now());
        }

        if (isVideoCall) {
          setTimeout(() => {
            if (cancelled) return;
            engine.enableLocalVideo(true);
            engine.muteLocalVideoStream(false);
            engine.startPreview?.();
          }, 250);
        }
      },
      onUserJoined: (_conn: unknown, uid: number) => {
        if (!cancelled) setRemoteUid(uid);
      },
      onUserOffline: (_conn: unknown, uid: number) => {
        if (!cancelled) setRemoteUid((prev) => (prev === uid ? null : prev));
      },
      onError: (_code: number, msg: string) => {
        if (!cancelled) setChannelError(msg || "Error en la llamada");
      },
    };

    eventsRef.current = events;

    void (async () => {
      try {
        if (Platform.OS === "android") {
          const perms: string[] = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
          if (isVideoCall) perms.push(PermissionsAndroid.PERMISSIONS.CAMERA);
          const result = await PermissionsAndroid.requestMultiple(perms as any);
          const denied = Object.values(result).some((v) => v !== PermissionsAndroid.RESULTS.GRANTED);
          if (denied) throw new Error("Permisos de cámara/micrófono denegados");
        }

        const tokenData = await getAgoraToken(session.callId, numericUid);
        if (cancelled) return;

        engine.initialize({
          appId: tokenData.appId,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });
        engine.registerEventHandler(events);
        engine.enableAudio();
        engine.setEnableSpeakerphone(true);

        if (isVideoCall) {
          engine.enableVideo();
          engine.enableLocalVideo(true);
          engine.muteLocalVideoStream(true);
        }

        engine.joinChannel(tokenData.token, session.callId, numericUid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: isVideoCall,
          autoSubscribeAudio: true,
          autoSubscribeVideo: isVideoCall,
        });
      } catch (error: any) {
        if (!cancelled) setChannelError(error?.message ?? "No se pudo conectar");
      }
    })();

    return () => {
      cancelled = true;
      hasConnectedRef.current = false;

      try {
        if (eventsRef.current) engine.unregisterEventHandler(eventsRef.current);
        if (isVideoCall) engine.stopPreview?.();
        engine.leaveChannel();
        engine.release();
      } catch {
        // no-op
      }

      engineRef.current = null;
      eventsRef.current = null;
      setEngineReady(false);
      setRemoteUid(null);
      setAgoraConnectedAt(null);
    };
  }, [isVideoCall, session?.callId, session?.status, user?.id]);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    engineRef.current?.muteLocalAudioStream(next);
    showControls();
  };

  const handleToggleSpeaker = () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    engineRef.current?.setEnableSpeakerphone(next);
    showControls();
  };

  const handleToggleCamera = () => {
    const next = !cameraMuted;
    setCameraMuted(next);
    engineRef.current?.muteLocalVideoStream(next);
    if (!next) {
      engineRef.current?.enableLocalVideo(true);
      engineRef.current?.startPreview?.();
    }
    showControls();
  };

  const handleFlipCamera = () => {
    engineRef.current?.switchCamera?.();
    showControls();
  };

  const handleEndCall = () => {
    if (session) endCall(session.callId);
    router.back();
  };

  if (!session) {
    return (
      <View style={styles.page}>
        <Text style={styles.missingTitle}>Llamada no disponible</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const statusLabel =
    session.status === "ringing"
      ? "Llamando..."
      : session.status === "connected"
        ? engineReady
          ? durationLabel
          : "Conectando..."
        : session.status === "rejected"
          ? "Rechazada"
          : "Finalizada";

  if (isVideoCall && session.status === "connected") {
    return (
      <Pressable style={styles.page} onPress={showControls}>
        {remoteUid !== null ? (
          <RtcSurfaceView style={StyleSheet.absoluteFill} canvas={{ uid: remoteUid, sourceType: srcRemote }} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.waitingBg]}>
            <View style={styles.waitingAvatar}>
              <Text style={styles.waitingAvatarText}>{session.otherUserName.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={styles.waitingName}>{session.otherUserName}</Text>
            <Text style={styles.waitingText}>
              {engineReady ? "Esperando al otro participante..." : "Conectando..."}
            </Text>
          </View>
        )}

        {controlsVisible && (
          <View style={styles.topBar} pointerEvents="none">
            <Text style={styles.topName}>{session.otherUserName}</Text>
            <Text style={styles.topTimer}>{statusLabel}</Text>
          </View>
        )}

        {!controlsVisible && agoraConnectedAt !== null && (
          <View style={styles.floatingTimer} pointerEvents="none">
            <Text style={styles.floatingTimerText}>{durationLabel}</Text>
          </View>
        )}

        {engineReady && (
          <Animated.View
            style={[styles.pip, { transform: pipAnim.getTranslateTransform() }]}
            {...pipPan.panHandlers}
          >
            <RtcSurfaceView
              style={StyleSheet.absoluteFill}
              canvas={{ uid: 0, sourceType: srcLocal }}
              zOrderMediaOverlay
            />

            {cameraMuted ? (
              <View style={styles.pipCameraOff}>
                <Ionicons name="videocam-off" size={22} color="rgba(255,255,255,0.55)" />
              </View>
            ) : null}

            <View style={styles.pipLabel}>
              <Text style={styles.pipLabelText}>Tú</Text>
            </View>
          </Animated.View>
        )}

        {controlsVisible && (
          <View style={styles.controlsBar}>
            <View style={styles.controlsRow}>
              <Pressable onPress={handleToggleMute} style={[styles.ctrlBtn, muted && styles.ctrlBtnActive]}>
                <Ionicons name={muted ? "mic-off" : "mic"} size={22} color="#fff" />
                <Text style={styles.ctrlLabel}>{muted ? "Silenciado" : "Micrófono"}</Text>
              </Pressable>

              <Pressable
                onPress={handleToggleCamera}
                style={[styles.ctrlBtn, cameraMuted && styles.ctrlBtnActive]}
              >
                <Ionicons name={cameraMuted ? "videocam-off" : "videocam"} size={22} color="#fff" />
                <Text style={styles.ctrlLabel}>{cameraMuted ? "Sin cámara" : "Cámara"}</Text>
              </Pressable>

              <Pressable
                onPress={handleFlipCamera}
                style={[styles.ctrlBtn, cameraMuted && styles.ctrlBtnDisabled]}
                disabled={cameraMuted}
              >
                <Ionicons
                  name="camera-reverse"
                  size={22}
                  color={cameraMuted ? "rgba(255,255,255,0.3)" : "#fff"}
                />
                <Text style={[styles.ctrlLabel, cameraMuted && { opacity: 0.35 }]}>Voltear</Text>
              </Pressable>

              <Pressable
                onPress={handleToggleSpeaker}
                style={[styles.ctrlBtn, !speakerOn && styles.ctrlBtnActive]}
              >
                <Ionicons name={speakerOn ? "volume-high" : "volume-mute"} size={22} color="#fff" />
                <Text style={styles.ctrlLabel}>{speakerOn ? "Altavoz" : "Auricular"}</Text>
              </Pressable>
            </View>

            <Pressable onPress={handleEndCall} style={styles.endBtnLarge}>
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
            </Pressable>
          </View>
        )}

        {channelError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{channelError}</Text>
          </View>
        ) : null}

        {session.warningBalance !== undefined && controlsVisible ? (
          <View style={styles.warningPill}>
            <Ionicons name="alert-circle-outline" size={14} color="#9A4C00" />
            <Text style={styles.warningText}>Saldo: {Math.floor(session.warningBalance)} crd</Text>
          </View>
        ) : null}

        {session.billed ? (
          <View style={styles.billingCard}>
            <Text style={styles.billingTitle}>Resumen</Text>
            <Text style={styles.billingLine}>Créditos: {session.billed.creditsCharged}</Text>
            <Text style={styles.billingLine}>Minutos: {session.billed.minutesBilled}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable style={styles.backCircle} onPress={handleEndCall}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarText}>{session.otherUserName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{session.otherUserName}</Text>
        <Text style={styles.subtitle}>{statusLabel}</Text>
        <Text style={styles.callTypeLabel}>{isVideoCall ? "Videollamada" : "Llamada de voz"}</Text>
      </View>

      {session.status === "connected" ? (
        <View style={styles.statusPill}>
          <Ionicons name={engineReady ? "checkmark-circle" : "sync-outline"} size={14} color="#CFE6FF" />
          <Text style={styles.statusText}>{engineReady ? "Conectado" : "Conectando..."}</Text>
        </View>
      ) : null}

      {channelError ? <Text style={styles.audioError}>{channelError}</Text> : null}

      {session.billed ? (
        <View style={styles.billingCard}>
          <Text style={styles.billingTitle}>Resumen</Text>
          <Text style={styles.billingLine}>Créditos: {session.billed.creditsCharged}</Text>
          <Text style={styles.billingLine}>Minutos: {session.billed.minutesBilled}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {session.status === "connected" ? (
          <>
            <Pressable
              style={[styles.secondaryBtn, muted && styles.secondaryBtnActive]}
              onPress={handleToggleMute}
            >
              <Ionicons name={muted ? "mic-off" : "mic"} size={20} color="#fff" />
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, !speakerOn && styles.secondaryBtnActive]}
              onPress={handleToggleSpeaker}
            >
              <Ionicons name={speakerOn ? "volume-high" : "volume-mute"} size={20} color="#fff" />
            </Pressable>
          </>
        ) : null}
        <Pressable style={styles.endBtnSmall} onPress={handleEndCall}>
          <Ionicons name="call" size={22} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0F1824",
  },
  waitingBg: {
    backgroundColor: "#0F1824",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  waitingAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  waitingAvatarText: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "700",
    fontFamily: appTheme.fonts.heading,
  },
  waitingName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: appTheme.fonts.heading,
  },
  waitingText: {
    color: "#94A3B8",
    fontSize: 14,
    fontFamily: appTheme.fonts.body,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 54,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
  },
  topName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: appTheme.fonts.heading,
  },
  topTimer: {
    color: "#D3E3F2",
    fontSize: 14,
    fontFamily: appTheme.fonts.body,
    marginTop: 2,
  },
  floatingTimer: {
    position: "absolute",
    top: 52,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.40)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  floatingTimerText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: appTheme.fonts.body,
    letterSpacing: 0.5,
  },
  pip: {
    position: "absolute",
    top: 130,
    right: 16,
    width: 110,
    height: 165,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "#1E293B",
    zIndex: 10,
  },
  pipCameraOff: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
  },
  pipLabel: {
    position: "absolute",
    bottom: 6,
    left: 7,
    backgroundColor: "rgba(15,24,40,0.7)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pipLabelText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: appTheme.fonts.body,
  },
  controlsBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 44,
    backgroundColor: "rgba(0,0,0,0.60)",
    alignItems: "center",
    gap: 18,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  ctrlBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  ctrlBtnActive: {
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  ctrlBtnDisabled: {
    opacity: 0.45,
  },
  ctrlLabel: {
    color: "#fff",
    fontSize: 10,
    fontFamily: appTheme.fonts.body,
    textAlign: "center",
  },
  endBtnLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    position: "absolute",
    top: 115,
    left: 16,
    right: 16,
    backgroundColor: "rgba(220,38,38,0.85)",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: appTheme.fonts.body,
  },
  warningPill: {
    position: "absolute",
    bottom: 175,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF7E6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#F8E6B8",
  },
  warningText: {
    color: "#9A4C00",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: appTheme.fonts.body,
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
  },
  backCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  avatarBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "700",
    fontFamily: appTheme.fonts.heading,
  },
  name: {
    marginTop: 18,
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    fontFamily: appTheme.fonts.heading,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    color: "#D3E3F2",
    fontSize: 16,
    fontFamily: appTheme.fonts.body,
    textAlign: "center",
  },
  callTypeLabel: {
    marginTop: 8,
    color: "#B9D0E6",
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusPill: {
    alignSelf: "center",
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: "rgba(91,155,213,0.35)",
    borderWidth: 1,
    borderColor: "rgba(207,230,255,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    color: "#E3F2FF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: appTheme.fonts.body,
  },
  audioError: {
    marginTop: 8,
    color: "#FCA5A5",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 16,
    fontFamily: appTheme.fonts.body,
  },
  billingCard: {
    alignSelf: "center",
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    minWidth: 190,
  },
  billingTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: appTheme.fonts.heading,
    marginBottom: 6,
  },
  billingLine: {
    color: "#E6F2FF",
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
  },
  actions: {
    paddingBottom: 40,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  secondaryBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnActive: {
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  endBtnSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  missingTitle: {
    marginTop: 80,
    color: "#fff",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: appTheme.fonts.heading,
  },
  backBtn: {
    marginTop: 20,
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: appTheme.colors.primary,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: appTheme.fonts.body,
  },
});
