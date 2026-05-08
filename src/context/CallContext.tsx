import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "./AuthContext";
import { appTheme } from "../theme/appTheme";
import { useCallSocket, type CallType, type IncomingCallData } from "../hooks/useCallSocket";
import { getCommunicationAccess } from "../api/communication";

type CallStatus = "ringing" | "connected" | "ended" | "rejected";

export type CallSession = {
  callId: string;
  callType: CallType;
  role: "caller" | "receiver";
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  status: CallStatus;
  startedAt?: number;
};

type StartOutgoingCallInput = {
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string | null;
  callType: CallType;
};

type CallContextValue = {
  startOutgoingCall: (input: StartOutgoingCallInput) => Promise<void>;
  acceptIncomingCall: () => void;
  rejectIncomingCall: () => void;
  endCall: (callId: string) => void;
  getSession: (callId: string) => CallSession | null;
  incomingCall: IncomingCallData | null;
};

const CallContext = createContext<CallContextValue | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const {
    requestCall,
    acceptCall,
    rejectCall,
    endCall: emitEndCall,
    onIncomingCall,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onCallError,
  } = useCallSocket(user?.id);

  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [sessions, setSessions] = useState<Record<string, CallSession>>({});

  useEffect(() => {
    const unsubIncoming = onIncomingCall((data) => {
      if (!data?.callId) return;
      setIncomingCall(data);
    });

    const unsubAccepted = onCallAccepted(({ callId }) => {
      if (!callId) return;
      setSessions((prev) => {
        const current = prev[callId];
        if (!current) return prev;
        return {
          ...prev,
          [callId]: {
            ...current,
            status: "connected",
            startedAt: Date.now(),
          },
        };
      });
      if (!pathname.startsWith("/call/")) {
        router.push({ pathname: "/call/[callId]", params: { callId } } as any);
      }
    });

    const unsubRejected = onCallRejected(({ callId }) => {
      if (!callId) return;
      setSessions((prev) => {
        const current = prev[callId];
        if (!current) return prev;
        return {
          ...prev,
          [callId]: { ...current, status: "rejected" },
        };
      });
      Alert.alert("Llamada rechazada", "El usuario no aceptó la llamada.");
    });

    const unsubEnded = onCallEnded(({ callId }) => {
      if (!callId) return;
      setSessions((prev) => {
        const current = prev[callId];
        if (!current) return prev;
        return {
          ...prev,
          [callId]: { ...current, status: "ended" },
        };
      });
    });

    const unsubError = onCallError(({ callId, message }) => {
      if (callId) {
        setSessions((prev) => {
          const current = prev[callId];
          if (!current) return prev;
          return {
            ...prev,
            [callId]: { ...current, status: "ended" },
          };
        });
      }

      Alert.alert("No se pudo iniciar la llamada", message ?? "Solo puedes iniciar llamadas durante una sesión activa.");
    });

    return () => {
      unsubIncoming();
      unsubAccepted();
      unsubRejected();
      unsubEnded();
      unsubError();
    };
  }, [
    onIncomingCall,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onCallError,
    pathname,
    router,
  ]);

  async function startOutgoingCall(input: StartOutgoingCallInput) {
    if (!user?.id) return;

    try {
      const access = await getCommunicationAccess(input.receiverId);
      if (!access.allowed) {
        Alert.alert(
          "Llamada no disponible",
          access.message ?? "Solo puedes iniciar llamadas durante una sesión activa.",
        );
        return;
      }
    } catch (error: any) {
      Alert.alert(
        "No se pudo validar la llamada",
        error?.message ?? "Solo puedes iniciar llamadas durante una sesión activa.",
      );
      return;
    }

    const callId = `call-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    const callerName = fullName || user.email || "Cliente";

    setSessions((prev) => ({
      ...prev,
      [callId]: {
        callId,
        callType: input.callType,
        role: "caller",
        otherUserId: input.receiverId,
        otherUserName: input.receiverName,
        otherUserAvatar: input.receiverAvatar ?? null,
        status: "ringing",
      },
    }));

    requestCall({
      callId,
      callerId: user.id,
      receiverId: input.receiverId,
      callType: input.callType,
      callerName,
      callerAvatar: null,
    });

    router.push({ pathname: "/call/[callId]", params: { callId } } as any);
  }

  function acceptIncomingCall() {
    if (!incomingCall) return;

    acceptCall(incomingCall.callId, incomingCall.callerId);

    setSessions((prev) => ({
      ...prev,
      [incomingCall.callId]: {
        callId: incomingCall.callId,
        callType: incomingCall.callType,
        role: "receiver",
        otherUserId: incomingCall.callerId,
        otherUserName: incomingCall.callerName,
        otherUserAvatar: incomingCall.callerAvatar,
        status: "connected",
        startedAt: Date.now(),
      },
    }));

    const callId = incomingCall.callId;
    setIncomingCall(null);
    router.push({ pathname: "/call/[callId]", params: { callId } } as any);
  }

  function rejectIncomingCall() {
    if (!incomingCall) return;
    rejectCall(incomingCall.callId, incomingCall.callerId);
    setIncomingCall(null);
  }

  function endCall(callId: string) {
    const session = sessions[callId];
    if (!session) return;
    emitEndCall(callId, session.otherUserId);
    setSessions((prev) => ({
      ...prev,
      [callId]: { ...session, status: "ended" },
    }));
  }

  function getSession(callId: string) {
    return sessions[callId] ?? null;
  }

  const value: CallContextValue = {
    startOutgoingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    getSession,
    incomingCall,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      <Modal visible={Boolean(incomingCall)} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>
              {incomingCall?.callType === "VIDEO_CALL" ? "Videollamada entrante" : "Llamada entrante"}
            </Text>
            <Text style={styles.name}>{incomingCall?.callerName ?? "Cliente"}</Text>
            <Text style={styles.meta}>Responder llamada</Text>

            <View style={styles.actions}>
              <Pressable style={styles.rejectBtn} onPress={rejectIncomingCall}>
                <Ionicons name="call" size={18} color="#FFFFFF" style={{ transform: [{ rotate: "135deg" }] }} />
              </Pressable>
              <Pressable style={styles.acceptBtn} onPress={acceptIncomingCall}>
                <Ionicons
                  name={incomingCall?.callType === "VIDEO_CALL" ? "videocam" : "call"}
                  size={18}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </CallContext.Provider>
  );
}

export function useCallManager() {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCallManager debe usarse dentro de CallProvider");
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  title: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "700",
  },
  name: {
    marginTop: 4,
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
    fontSize: 22,
    fontWeight: "700",
  },
  meta: {
    marginTop: 8,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
  actions: {
    marginTop: 20,
    flexDirection: "row",
    gap: 24,
  },
  rejectBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: appTheme.colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
});
