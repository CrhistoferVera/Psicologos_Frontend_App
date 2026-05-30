import type { BookingPaymentInitResponse } from '../../../api/bookings';

// Store temporal para pasar el resultado de initBookingPayment
// desde BookingScheduleScreen a BookingPaymentScreen sin un segundo round-trip.
let _data: BookingPaymentInitResponse | null = null;
let _bookingId: string | null = null;

export const pendingPaymentStore = {
  set(bookingId: string, data: BookingPaymentInitResponse) {
    _bookingId = bookingId;
    _data = data;
  },
  consume(bookingId: string): BookingPaymentInitResponse | null {
    if (_bookingId !== bookingId) return null;
    const data = _data;
    _data = null;
    _bookingId = null;
    return data;
  },
  clear() {
    _data = null;
    _bookingId = null;
  },
};
