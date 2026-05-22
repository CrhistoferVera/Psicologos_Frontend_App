export type ProfessionalPriceMap = {
  chat?: number | null;
  call?: number | null;
  video?: number | null;
};

export type Professional = {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  specialties: string[];
  isOnline: boolean;
  rating?: number;
  reviewCount?: number;
  prices: ProfessionalPriceMap;
};

