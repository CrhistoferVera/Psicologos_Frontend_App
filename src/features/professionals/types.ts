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
  bio: string;
  specialties: string[];
  isOnline: boolean;
  rating?: number;
  prices: ProfessionalPriceMap;
};

