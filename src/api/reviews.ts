import { apiFetch } from '../services/api';

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  client: { name: string; avatarUrl: string | null };
};

export type ReviewsResponse = {
  data: Review[];
  total: number;
  page: number;
  limit: number;
};

export function createReview(data: {
  bookingId: string;
  rating: number;
  comment?: string;
}): Promise<void> {
  return apiFetch('/reviews', { method: 'POST', body: JSON.stringify(data) });
}

export function getProfessionalReviews(
  professionalId: string,
  page = 1,
  limit = 20,
): Promise<ReviewsResponse> {
  return apiFetch(`/reviews/professional/${professionalId}?page=${page}&limit=${limit}`);
}
