import type { EducationEntry } from "../professionals/types";

export type { EducationEntry };

export type ProfessionalRole = "PROFESSIONAL" | "ANFITRIONA";

export type ProfessionalProfile = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  title: string | null;
  bio: string;
  isOnline: boolean;
  avatarUrl: string | null;
  coverUrl: string | null;
  rateCredits?: number;
  reviewStatus?: "PENDING" | "APPROVED" | "REJECTED";
  reviewNotes?: string | null;
  education?: EducationEntry[];
  languages?: string[];
  availability?: {
    monFri?: string;
    sat?: string;
    sun?: string;
    [key: string]: unknown;
  } | null;
  // Estado de cobro: CI => canCharge false hasta que suba y verifiquemos su título.
  canCharge?: boolean;
  verificationDocType?: VerificationDocType | null;
  chargeVerificationPending?: boolean;
  hasTitulo?: boolean;
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

// Documento con el que el profesional se verifica (elige 1). CI => solo sesiones
// gratuitas; TITULO o MATRICULA => puede cobrar dentro de la app.
export type VerificationDocType = "CI" | "TITULO" | "MATRICULA";

export type ProfessionalRegisterPayload = {
  tempToken: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  bio?: string;
  dateOfBirth: string;
  cedula: string;
  referralCode?: string;
  country: string;
  kycVideo?: KycFileAsset;
  verificationDocType: VerificationDocType;
  verificationDoc?: KycFileAsset;
};

export type RegistrationProgress = {
  completedAt: string;
  selectedSpecialties: string[];
  prices: ProfessionalPriceInput;
};
