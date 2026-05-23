export type ProfessionalPriceMap = {
  chat?: number | null;
  call?: number | null;
  video?: number | null;
};

export type EducationEntry = {
  id: string;
  degree: string;
  institution: string;
  year: number;
  description?: string;
  photoUrl?: string;
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
  education?: EducationEntry[];
  isVerified?: boolean;
};

