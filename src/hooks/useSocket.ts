import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import type { Message } from '../api/messages';
import { getAccessToken } from '../storage/authStorage';

export function useSocket(userId: string | null | undefined) {
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

  function sendMessage(receiverId: string, text: string, _senderId?: string) {
    socketRef.current?.emit('send_message', { receiverId, text });
  }

  function onNewMessage(callback: (msg: Message) => void) {
    socketRef.current?.on('new_message', callback);
    return () => {
      socketRef.current?.off('new_message', callback);
    };
  }

  function onMessageSent(callback: (msg: Message) => void) {
    socketRef.current?.on('message_sent', callback);
    return () => {
      socketRef.current?.off('message_sent', callback);
    };
  }

  return { sendMessage, onNewMessage, onMessageSent };
}
