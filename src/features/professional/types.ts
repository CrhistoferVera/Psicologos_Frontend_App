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
  idDoc?: { uri: string; name: string; type: string };
};

export type RegistrationProgress = {
  completedAt: string;
  selectedSpecialties: string[];
  prices: ProfessionalPriceInput;
};
