export type ProfessionalRole = "PROFESSIONAL" | "ANFITRIONA";

export type ProfessionalProfile = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  isOnline: boolean;
  avatarUrl: string | null;
  coverUrl: string | null;
  rateCredits?: number;
  reviewStatus?: "PENDING" | "APPROVED" | "REJECTED";
  reviewNotes?: string | null;
  availability?: {
    monFri?: string;
    sat?: string;
    sun?: string;
    [key: string]: unknown;
  } | null;
};

export type ProfessionalPriceInput = {
  chat: number;
  call: number;
  video: number;
};

export type ProfessionalStatsSummary = {
  totalBalance: number;
  today: number;
  thisWeek: number;
  totalTransactions: number;
  unreadChats: number;
};

export type ProfessionalChatItem = {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
};

export type KycFileAsset = { uri: string; name: string; type: string };

export type ProfessionalRegisterPayload = {
  tempToken: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  dateOfBirth: string;
  cedula: string;
  idDoc?: KycFileAsset;
  kycVideo?: KycFileAsset;
  kycSelfie?: KycFileAsset;
  matricula?: KycFileAsset;
  tituloProfesional?: KycFileAsset;
};

export type RegistrationProgress = {
  completedAt: string;
  selectedSpecialties: string[];
  prices: ProfessionalPriceInput;
};
