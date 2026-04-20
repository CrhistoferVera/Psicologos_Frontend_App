export type AdminKpi = {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "positive" | "warning";
};

export type AdminStatsResponse = {
  clients: {
    total: number;
    active: number;
    suspended: number;
    newThisMonth: number;
  };
  professionals: {
    total: number;
    active: number;
    inactive: number;
  };
  deposits: {
    pending: number;
    approvedToday: number;
    totalRevenue: number;
  };
  withdrawals: {
    pending: number;
  };
  activity: {
    messages: number;
  };
};

export type AdminUserRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  wallet?: { balance: number } | null;
};

export type AdminProfessionalRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  wallet?: { balance: number } | null;
  professionalProfile?: {
    username?: string;
    avatarUrl?: string | null;
    bio?: string | null;
    rateCredits?: number | null;
    isOnline?: boolean;
    idDocUrl?: string | null;
    reviewStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
    reviewNotes?: string | null;
    kycVideoUrl?: string | null;
    kycSelfieUrl?: string | null;
    matriculaUrl?: string | null;
    tituloProfesionalUrl?: string | null;
    kycFaceMatchScore?: number | null;
    kycFaceMatchStatus?: "PENDING" | "PASSED" | "FAILED" | "SKIPPED" | null;
  } | null;
};

export type AdminPaginated<T> = {
  data: T[];
  nextCursor: string | null;
};

export type AdminWithdrawalRecord = {
  id: string;
  credits: number;
  soles: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  bankName: string;
  accountNumber: string;
  professional: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phoneNumber?: string;
    email?: string | null;
  };
  currentBalance?: number;
  createdAt: string;
  updatedAt?: string;
};

export type AdminDepositRecord = {
  id: string;
  userId: string;
  amountBs: number;
  creditsToDeliver: number;
  packageNameAtMoment?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phoneNumber: string;
  };
};

export type AdminSpecialty = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PromotionalGrantRecord = {
  id: string;
  amount: number;
  reason: string | null;
  createdAt: string;
  admin: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  recipient: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  transactionId: string;
};
