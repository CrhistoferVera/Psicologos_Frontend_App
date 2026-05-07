import apiClient from './client';

export type SessionOffering = {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  priceBob: number;
  priceUsd: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SessionOfferingInput = {
  title: string;
  description?: string;
  durationMinutes: number;
  priceBob: number;
};

export type WeekDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type AvailabilityRule = {
  id: string;
  professionalId: string;
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AvailabilityRuleInput = {
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

export type ProfessionalBooking = {
  id: string;
  status: string;
  currency: string;
  paymentMethod?: string | null;
  paymentStatus: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  timezone: string;
  priceBob: number;
  priceUsd: number;
  client?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
  };
  sessionOffering?: {
    id: string;
    title: string;
    durationMinutes: number;
  };
};

export async function getMySessionOfferings() {
  const res = await apiClient.get<SessionOffering[]>('/professional/session-offerings');
  return res.data;
}

export async function createSessionOffering(payload: SessionOfferingInput) {
  const res = await apiClient.post<SessionOffering>('/professional/session-offerings', payload);
  return res.data;
}

export async function updateSessionOffering(id: string, payload: Partial<SessionOfferingInput>) {
  const res = await apiClient.patch<SessionOffering>(`/professional/session-offerings/${id}`, payload);
  return res.data;
}

export async function updateSessionOfferingStatus(id: string, isActive: boolean) {
  const res = await apiClient.patch<SessionOffering>(`/professional/session-offerings/${id}/status`, { isActive });
  return res.data;
}

export async function getAvailabilityRules() {
  const res = await apiClient.get<AvailabilityRule[]>('/professional/availability-rules');
  return res.data;
}

export async function createAvailabilityRule(payload: AvailabilityRuleInput) {
  const res = await apiClient.post<AvailabilityRule>('/professional/availability-rules', payload);
  return res.data;
}

export async function updateAvailabilityRule(id: string, payload: Partial<AvailabilityRuleInput>) {
  const res = await apiClient.patch<AvailabilityRule>(`/professional/availability-rules/${id}`, payload);
  return res.data;
}

export async function deleteAvailabilityRule(id: string) {
  const res = await apiClient.delete<{ message?: string }>(`/professional/availability-rules/${id}`);
  return res.data;
}

export async function getProfessionalBookings() {
  const res = await apiClient.get<ProfessionalBooking[]>('/professional/bookings');
  return res.data;
}
