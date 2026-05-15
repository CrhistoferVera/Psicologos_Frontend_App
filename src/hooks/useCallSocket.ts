import { AppState } from 'react-native';
import { useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { getAccessToken } from '../storage/authStorage';

export type CallType = 'CALL' | 'VIDEO_CALL';

export interface IncomingCallData {
  callId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  callerName: string;
  callerAvatar: string | null;
}

type RequestCallPayload = {
  callId: string;
  receiverId: string;
  callType: CallType;
  callerName: string;
  callerAvatar: string | null;
};

export function useCallSocket(userId: string | null | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const incomingListenersRef = useRef(new Set<(data: IncomingCallData) => void>());
  const ringingListenersRef = useRef(new Set<(data: { callId: string }) => void>());
  const acceptedListenersRef = useRef(new Set<(data: { callId: string }) => void>());
  const rejectedListenersRef = useRef(new Set<(data: { callId: string }) => void>());
  const endedListenersRef = useRef(new Set<(data: { callId: string }) => void>());
  const errorListenersRef = useRef(new Set<(data: { callId?: string; message?: string }) => void>());

  const bindPersistentListeners = useCallback((socket: Socket) => {
    incomingListenersRef.current.forEach((listener) => socket.on('incoming_call', listener));
    ringingListenersRef.current.forEach((listener) => socket.on('call_ringing', listener));
    acceptedListenersRef.current.forEach((listener) => socket.on('call_accepted', listener));
    rejectedListenersRef.current.forEach((listener) => socket.on('call_rejected', listener));
    endedListenersRef.current.forEach((listener) => socket.on('call_ended', listener));
    errorListenersRef.current.forEach((listener) => socket.on('call_error', listener));
  }, []);

  const emitRegister = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !userId || !authTokenRef.current) return;
    console.log('[useCallSocket] register emitted', { userId, socketId: socket.id });
    socket.emit('register', { userId, token: authTokenRef.current });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let disposed = false;
    let localSocket: Socket | null = null;

    void (async () => {
      const token = await getAccessToken();
      if (disposed || !token) return;
      authTokenRef.current = token;

      const socket = io(API_URL, {
        transports: ['websocket'],
        auth: { token },
      });
      localSocket = socket;
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[useCallSocket] socket connected', { userId, socketId: socket.id });
        emitRegister();
      });
      socket.on('disconnect', (reason) => {
        console.log('[useCallSocket] socket disconnected', { userId, socketId: socket.id, reason });
      });

      bindPersistentListeners(socket);
    })();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const socket = socketRef.current;
      if (!socket) return;
      if (socket.connected) {
        emitRegister();
        return;
      }
      socket.connect();
    });

    return () => {
      disposed = true;
      appStateSub.remove();
      localSocket?.disconnect();
      socketRef.current = null;
      authTokenRef.current = null;
    };
  }, [bindPersistentListeners, emitRegister, userId]);

  const requestCall = useCallback((data: RequestCallPayload) => {
    socketRef.current?.emit('call_request', data);
  }, []);

  const acceptCall = useCallback((callId: string) => {
    socketRef.current?.emit('call_accepted', { callId });
  }, []);

  const rejectCall = useCallback((callId: string) => {
    socketRef.current?.emit('call_rejected', { callId });
  }, []);

  const endCall = useCallback((callId: string) => {
    socketRef.current?.emit('call_ended', { callId });
  }, []);

  const onIncomingCall = useCallback((cb: (data: IncomingCallData) => void) => {
    incomingListenersRef.current.add(cb);
    socketRef.current?.on('incoming_call', cb);
    return () => {
      incomingListenersRef.current.delete(cb);
      socketRef.current?.off('incoming_call', cb);
    };
  }, []);

  const onCallRinging = useCallback((cb: (data: { callId: string }) => void) => {
    ringingListenersRef.current.add(cb);
    socketRef.current?.on('call_ringing', cb);
    return () => {
      ringingListenersRef.current.delete(cb);
      socketRef.current?.off('call_ringing', cb);
    };
  }, []);

  const onCallAccepted = useCallback((cb: (data: { callId: string }) => void) => {
    acceptedListenersRef.current.add(cb);
    socketRef.current?.on('call_accepted', cb);
    return () => {
      acceptedListenersRef.current.delete(cb);
      socketRef.current?.off('call_accepted', cb);
    };
  }, []);

  const onCallRejected = useCallback((cb: (data: { callId: string }) => void) => {
    rejectedListenersRef.current.add(cb);
    socketRef.current?.on('call_rejected', cb);
    return () => {
      rejectedListenersRef.current.delete(cb);
      socketRef.current?.off('call_rejected', cb);
    };
  }, []);

  const onCallEnded = useCallback((cb: (data: { callId: string }) => void) => {
    endedListenersRef.current.add(cb);
    socketRef.current?.on('call_ended', cb);
    return () => {
      endedListenersRef.current.delete(cb);
      socketRef.current?.off('call_ended', cb);
    };
  }, []);

  const onCallError = useCallback((cb: (data: { callId?: string; message?: string }) => void) => {
    errorListenersRef.current.add(cb);
    socketRef.current?.on('call_error', cb);
    return () => {
      errorListenersRef.current.delete(cb);
      socketRef.current?.off('call_error', cb);
    };
  }, []);

  return {
    requestCall,
    acceptCall,
    rejectCall,
    endCall,
    onIncomingCall,
    onCallRinging,
    onCallAccepted,
    onCallRejected,
    onCallEnded,
    onCallError,
  };
}
