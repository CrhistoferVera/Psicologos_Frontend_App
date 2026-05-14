import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!userId) return;

    let disposed = false;
    let localSocket: Socket | null = null;

    void (async () => {
      const token = await getAccessToken();
      if (disposed || !token) return;

      const socket = io(API_URL, {
        transports: ['websocket'],
        auth: { token },
      });
      localSocket = socket;
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('register', { userId, token });
      });
    })();

    return () => {
      disposed = true;
      localSocket?.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  function requestCall(data: RequestCallPayload) {
    socketRef.current?.emit('call_request', data);
  }

  function acceptCall(callId: string) {
    socketRef.current?.emit('call_accepted', { callId });
  }

  function rejectCall(callId: string) {
    socketRef.current?.emit('call_rejected', { callId });
  }

  function endCall(callId: string) {
    socketRef.current?.emit('call_ended', { callId });
  }

  function onIncomingCall(cb: (data: IncomingCallData) => void) {
    socketRef.current?.on('incoming_call', cb);
    return () => socketRef.current?.off('incoming_call', cb);
  }

  function onCallRinging(cb: (data: { callId: string }) => void) {
    socketRef.current?.on('call_ringing', cb);
    return () => socketRef.current?.off('call_ringing', cb);
  }

  function onCallAccepted(cb: (data: { callId: string }) => void) {
    socketRef.current?.on('call_accepted', cb);
    return () => socketRef.current?.off('call_accepted', cb);
  }

  function onCallRejected(cb: (data: { callId: string }) => void) {
    socketRef.current?.on('call_rejected', cb);
    return () => socketRef.current?.off('call_rejected', cb);
  }

  function onCallEnded(cb: (data: { callId: string }) => void) {
    socketRef.current?.on('call_ended', cb);
    return () => socketRef.current?.off('call_ended', cb);
  }

  function onCallError(cb: (data: { callId?: string; message?: string }) => void) {
    socketRef.current?.on('call_error', cb);
    return () => socketRef.current?.off('call_error', cb);
  }

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
