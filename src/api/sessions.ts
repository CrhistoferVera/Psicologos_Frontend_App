import apiClient from './client';

export interface Session {
  id: string;
  professionalUserId: string;
  title: string;
  durationMinutes: number;
  priceInBs: number;
  priceInUsd: number;
  status: 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  professional?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    username?: string | null;
    bio?: string | null;
    specialties?: string[];
  };
  paymentsCount?: number;
  approvedCount?: number;
}

export interface SessionPaymentStatus {
  status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  currency: 'BOB' | 'USD' | null;
}

export const apiCreateSession = async (dto: {
  title: string;
  durationMinutes: number;
  priceInBs: number;
  description?: string;
}): Promise<Session> => {
  const res = await apiClient.post('/sessions', dto);
  return res.data;
};

export const apiUpdateSession = async (id: string, dto: {
  title?: string;
  durationMinutes?: number;
  priceInBs?: number;
  description?: string;
}): Promise<Session> => {
  const res = await apiClient.patch(`/sessions/${id}`, dto);
  return res.data;
};

export const apiStartSession = async (id: string): Promise<Session> => {
  const res = await apiClient.post(`/sessions/${id}/start`);
  return res.data;
};

export const apiEndSession = async (id: string): Promise<Session> => {
  const res = await apiClient.post(`/sessions/${id}/end`);
  return res.data;
};

export const apiCancelSession = async (id: string): Promise<{ message: string }> => {
  const res = await apiClient.delete(`/sessions/${id}`);
  return res.data;
};

export const apiGetMySessions = async (): Promise<Session[]> => {
  const res = await apiClient.get('/sessions/my');
  return res.data;
};

export const apiGetOpenSessions = async (): Promise<Session[]> => {
  const res = await apiClient.get('/sessions');
  return res.data;
};

export const apiGetSessionById = async (id: string): Promise<Session> => {
  const res = await apiClient.get(`/sessions/${id}`);
  return res.data;
};

export const apiPaySessionQr = async (sessionId: string): Promise<{
  paymentId: string;
  qrId: string;
  qrImage: string | null;
  amount: number;
  currency: string;
  dueDate: string;
}> => {
  const res = await apiClient.post(`/sessions/${sessionId}/pay-qr`);
  return res.data;
};

export const apiPaySessionStripe = async (sessionId: string): Promise<{
  clientSecret: string;
  customerId: string;
}> => {
  const res = await apiClient.post(`/sessions/${sessionId}/pay-stripe`);
  return res.data;
};

export const apiGetSessionPaymentStatus = async (sessionId: string): Promise<SessionPaymentStatus> => {
  const res = await apiClient.get(`/sessions/${sessionId}/payment-status`);
  return res.data;
};

export const apiGetSessionAccess = async (sessionId: string): Promise<{
  conversationId: string;
  professionalId: string;
  professionalName: string;
  professionalAvatar: string | null;
  sessionTitle: string;
}> => {
  const res = await apiClient.get(`/sessions/${sessionId}/access`);
  return res.data;
};

export const apiGetMyActiveSessions = async (): Promise<{
  sessionId: string;
  sessionTitle: string;
  sessionStatus: string;
  durationMinutes: number;
  priceInBs: number;
  priceInUsd: number;
  currency: string;
  amountPaid: number;
  endedAt?: string | null;
  professional: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    specialties: string[];
  };
}[]> => {
  const res = await apiClient.get('/sessions/my-active');
  return res.data;
};
