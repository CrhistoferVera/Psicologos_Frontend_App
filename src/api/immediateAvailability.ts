import apiClient from './client';
import { Booking, BookingPaymentInitResponse } from './bookings';

export type ImmediateProfessional = {
  professionalId: string;
  durationMinutes: number;
  priceBob: number;
  priceUsd: number;
  description?: string | null;
  expiresAt: string;
  professional: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    specialties: string[];
  };
};

export type ImmediateAvailabilityStatus = {
  isActive: boolean;
  durationMinutes?: number;
  priceBob?: number;
  description?: string | null;
  expiresAt?: string | null;
};

export type SetImmediateAvailabilityPayload = {
  durationMinutes: number;
  priceBob: number;
  activeForMinutes: number;
  description?: string;
};

export type ImmediateBookingResult = {
  booking: Booking;
  paymentInit: BookingPaymentInitResponse;
};

export async function getImmediateProfessionals() {
  const res = await apiClient.get<ImmediateProfessional[]>('/immediate-professionals');
  return res.data;
}

export async function getProfessionalImmediateDetail(professionalId: string) {
  const res = await apiClient.get<ImmediateProfessional>(`/professionals/${professionalId}/immediate`);
  return res.data;
}

export async function createImmediateBooking(professionalId: string) {
  const res = await apiClient.post<ImmediateBookingResult>('/bookings/immediate', { professionalId });
  return res.data;
}

export async function setImmediateAvailability(payload: SetImmediateAvailabilityPayload) {
  const res = await apiClient.post<ImmediateAvailabilityStatus>('/professional/immediate-availability', payload);
  return res.data;
}

export async function deactivateImmediateAvailability() {
  await apiClient.delete('/professional/immediate-availability');
}

export async function getMyImmediateAvailability() {
  const res = await apiClient.get<ImmediateAvailabilityStatus>('/professional/immediate-availability');
  return res.data;
}
