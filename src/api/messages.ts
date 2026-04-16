import { apiFetch } from '../services/api';

export interface Chat {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string | null;
  read: boolean;
  // Legacy optional fields kept for old screens until legacy routes are retired.
  isLocked?: boolean;
  price?: number | null;
  isUnlocked?: boolean;
  createdAt: string;
}

export interface ServicePrice {
  id: string;
  serviceType: string;
  price: number;
}

export function getChats(userId: string) {
  return apiFetch<Chat[]>(`/messages/chats?userId=${userId}`);
}

// Preferred endpoint wrapper for current backend (user inferred from JWT)
export function getMyChats() {
  return apiFetch<Chat[]>('/messages/chats');
}

export function getMessages(conversationId: string) {
  return apiFetch<Message[]>(`/messages?conversationId=${conversationId}`);
}

export function sendMessageHttp(
  senderId: string,
  receiverId: string,
  text: string,
  isLocked = false,
) {
  return apiFetch<Message>('/messages', {
    method: 'POST',
    body: JSON.stringify({ senderId, receiverId, text, isLocked }),
  });
}

// Preferred sender for MVP user flow (no legacy locked flag, sender inferred from JWT)
export function sendMessageToUser(receiverId: string, text: string) {
  return apiFetch<Message>('/messages', {
    method: 'POST',
    body: JSON.stringify({ receiverId, text }),
  });
}

export function unlockMessage(messageId: string) {
  return apiFetch<{ success: boolean; text: string }>(`/messages/${messageId}/unlock`, {
    method: 'POST',
  });
}

export function getMyServicePrices() {
  return apiFetch<ServicePrice[]>('/service-prices');
}

export function markAsRead(conversationId: string, userId: string) {
  return apiFetch<{ success: boolean }>('/messages/read', {
    method: 'POST',
    body: JSON.stringify({ conversationId, userId }),
  });
}

export function markConversationAsRead(conversationId: string) {
  return apiFetch<{ success: boolean }>('/messages/read', {
    method: 'POST',
    body: JSON.stringify({ conversationId }),
  });
}
