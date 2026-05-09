import { apiFetch } from '../services/api';

export type CommunicationAccessReason =
  | 'NO_CONFIRMED_BOOKING'
  | 'SESSION_NOT_STARTED'
  | 'SESSION_ENDED'
  | 'PAYMENT_PENDING'
  | 'UNKNOWN';

export type CommunicationAccess = {
  allowed: boolean;
  bookingId: string | null;
  sessionStartsAt: string | null;
  sessionEndsAt: string | null;
  reason: CommunicationAccessReason | null;
  message: string | null;
};

export function getCommunicationAccess(otherUserId: string) {
  return apiFetch<CommunicationAccess>(`/communication/access/${otherUserId}`);
}
