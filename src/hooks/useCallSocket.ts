import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

export type CallType = 'CALL' | 'VIDEO_CALL';

export interface IncomingCallData {
  callId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  callerName: string;
  callerAvatar: string | null;
  pricePerMinute: number;
}

export function useCallSocket(userId: string | null | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register', userId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  function requestCall(data: IncomingCallData) {
    socketRef.current?.emit('call_request', data);
  }

  function acceptCall(callId: string, callerId: string) {
    socketRef.current?.emit('call_accepted', { callId, callerId });
  }

  function rejectCall(callId: string, callerId: string) {
    socketRef.current?.emit('call_rejected', { callId, callerId });
  }

  function endCall(callId: string, otherUserId: string) {
    socketRef.current?.emit('call_ended', { callId, otherUserId });
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

  function onCallBilled(cb: (data: { creditsCharged: number; minutesBilled: number; durationSeconds: number }) => void) {
    socketRef.current?.on('call_billed', cb);
    return () => socketRef.current?.off('call_billed', cb);
  }

  function onCallWarning(cb: (data: { balance: number }) => void) {
    socketRef.current?.on('call_warning', cb);
    return () => socketRef.current?.off('call_warning', cb);
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
    onCallBilled,
    onCallWarning,
  };
}
