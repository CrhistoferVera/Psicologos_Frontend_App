import apiClient from './client';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CANCELLED_BY_CLIENT'
  | 'CANCELLED_BY_PROFESSIONAL'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'EXPIRED';

export type BookingPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'EXPIRED';
export type BookingPaymentMethod = 'BANECO_QR' | 'STRIPE' | 'WALLET';
export type BookingRescheduleRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type BookingRescheduleRequest = {
  id: string;
  bookingId: string;
  requestedByUserId: string;
  requestedByRole: 'USER' | 'PROFESSIONAL' | 'ANFITRIONA' | 'ADMIN';
  currentStartAt: string;
  currentEndAt: string;
  proposedStartAt: string;
  proposedEndAt: string;
  proposedTimezone: string;
  reason?: string | null;
  status: BookingRescheduleRequestStatus;
  respondedByUserId?: string | null;
  respondedAt?: string | null;
  responseNote?: string | null;
  requestExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    clientId: string;
    professionalId: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    timezone: string;
    status: BookingStatus;
    paymentStatus: BookingPaymentStatus;
    rescheduleCount: number;
  };
  requestedByUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: string | null;
  } | null;
  respondedByUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: string | null;
  } | null;
};

export type ProfessionalSessionOffering = {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  priceBob: number;
  priceUsd: number;
  isActive?: boolean;
};

export type AvailableSlot = {
  startAt: string;
  endAt: string;
  timezone: string;
};

export type Booking = {
  id: string;
  clientId: string;
  professionalId: string;
  sessionOfferingId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  timezone: string;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  paymentMethod?: BookingPaymentMethod | null;
  currency: 'BOB' | 'USD';
  priceBob: number;
  priceUsd: number;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sessionOffering?: {
    id: string;
    title: string;
    durationMinutes: number;
  };
  professional?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    professionalProfile?: {
      username?: string | null;
      avatarUrl?: string | null;
    };
  };
};

export type CreateBookingRescheduleRequestPayload = {
  proposedStartAt: string;
  proposedTimezone?: string;
  reason?: string;
};

export type BookingPaymentInitResponse = {
  bookingId: string;
  paymentMethod: BookingPaymentMethod;
  currency: 'BOB' | 'USD';
  amount: number;
  qrImage?: string | null;
  providerReference?: string | null;
  paymentIntentClientSecret?: string | null;
  customerId?: string | null;
  ephemeralKey?: string | null;
  publishableKey?: string | null;
  expiresAt?: string | Date | null;
};

const OFFERINGS_CACHE_TTL_MS = 5 * 60 * 1000;
const offeringsCache = new Map<string, { data: ProfessionalSessionOffering[]; fetchedAt: number }>();
const offeringsInFlight = new Map<string, Promise<ProfessionalSessionOffering[]>>();

export async function getProfessionalSessionOfferings(
  professionalId: string,
  options?: { force?: boolean },
) {
  const cached = offeringsCache.get(professionalId);
  const now = Date.now();

  if (!options?.force && cached && now - cached.fetchedAt < OFFERINGS_CACHE_TTL_MS) {
    return cached.data;
  }

  const inFlight = offeringsInFlight.get(professionalId);
  if (!options?.force && inFlight) {
    return inFlight;
  }

  const request = apiClient
    .get<ProfessionalSessionOffering[]>(`/professionals/${professionalId}/session-offerings`)
    .then((res) => {
      offeringsCache.set(professionalId, {
        data: res.data,
        fetchedAt: Date.now(),
      });
      return res.data;
    })
    .finally(() => {
      offeringsInFlight.delete(professionalId);
    });

  offeringsInFlight.set(professionalId, request);
  return request;
}

export async function getAvailableSlots(params: {
  professionalId: string;
  sessionOfferingId: string;
  date: string;
  timezone?: string;
}) {
  const res = await apiClient.get<AvailableSlot[]>(
    `/professionals/${params.professionalId}/available-slots`,
    {
      params: {
        sessionOfferingId: params.sessionOfferingId,
        date: params.date,
        ...(params.timezone ? { timezone: params.timezone } : {}),
      },
    },
  );
  return res.data;
}

export async function createBooking(payload: {
  professionalId: string;
  sessionOfferingId: string;
  scheduledStartAt: string;
  timezone?: string;
}) {
  const res = await apiClient.post<Booking>('/bookings', payload);
  return res.data;
}

export async function createBatchBookings(payload: {
  bookings: Array<{
    professionalId: string;
    sessionOfferingId: string;
    scheduledStartAt: string;
    timezone?: string;
  }>;
}) {
  const res = await apiClient.post<{ bookings: Booking[] }>('/bookings/batch', payload);
  return res.data;
}

export async function initBookingPayment(bookingId: string) {
  const res = await apiClient.post<BookingPaymentInitResponse>(`/bookings/${bookingId}/payment`);
  return res.data;
}

export async function getMyBooking(bookingId: string) {
  const res = await apiClient.get<Booking>(`/bookings/${bookingId}`);
  return res.data;
}

export async function getMyBookings(params?: {
  status?: BookingStatus;
  from?: string;
  to?: string;
}) {
  const res = await apiClient.get<Booking[]>('/bookings/me', {
    params: {
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.from ? { from: params.from } : {}),
      ...(params?.to ? { to: params.to } : {}),
    },
  });
  return res.data;
}

export async function createBookingRescheduleRequest(
  bookingId: string,
  payload: CreateBookingRescheduleRequestPayload,
) {
  const res = await apiClient.post<BookingRescheduleRequest>(
    `/bookings/${bookingId}/reschedule-requests`,
    payload,
  );
  return res.data;
}

export async function getBookingRescheduleRequests(bookingId: string) {
  const res = await apiClient.get<BookingRescheduleRequest[]>(`/bookings/${bookingId}/reschedule-requests`);
  return res.data;
}

export async function getMyBookingRescheduleRequests(params?: {
  status?: BookingRescheduleRequestStatus;
}) {
  const res = await apiClient.get<BookingRescheduleRequest[]>('/bookings/reschedule-requests/me', {
    params: {
      ...(params?.status ? { status: params.status } : {}),
    },
  });
  return res.data;
}

export async function acceptBookingRescheduleRequest(requestId: string, payload?: { responseNote?: string }) {
  const res = await apiClient.patch<BookingRescheduleRequest>(
    `/bookings/reschedule-requests/${requestId}/accept`,
    payload ?? {},
  );
  return res.data;
}

export async function rejectBookingRescheduleRequest(requestId: string, payload?: { responseNote?: string }) {
  const res = await apiClient.patch<BookingRescheduleRequest>(
    `/bookings/reschedule-requests/${requestId}/reject`,
    payload ?? {},
  );
  return res.data;
}

export async function cancelBookingRescheduleRequest(requestId: string) {
  const res = await apiClient.patch<BookingRescheduleRequest>(`/bookings/reschedule-requests/${requestId}/cancel`);
  return res.data;
}

