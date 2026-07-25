
export type UserProfileData = {
    userName: string;
    bio: string | null;
    avatarUrl: string | null;
};

export type WalletData = {
    id: string;
    balance: number;
};

export type MyProfileData = {
    id: string;
    phoneNumber: string;
    phoneDialCode?: string | null;
    phoneNationalNumber?: string | null;
    phoneCountryIso?: string | null;
    phoneCountryName?: string | null;
    country?: string | null;
    billingRegion?: string | null;
    preferredCurrency?: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isProfileComplete: boolean;
    userProfile?: UserProfileData | null;
    UserProfile?: UserProfileData | null;
    wallet?: WalletData | null;
};

export type UpdateProfilePayload = {
    firstName?: string;
    lastName?: string;
    userName?: string; // Recuerda si en el back es userName o username
    bio?: string;
};

export interface ExpenseHistoryItem {
    id: string;
    monto: number | string; // Prisma Decimal llega como string a veces
    tipo: 'MESSAGE_UNLOCK' | 'IMAGE_UNLOCK' | 'DEPOSIT' | 'CALL_PAYMENT' | 'EARNING';
    fecha: string;
    descripcion: string | null;
    detalle: string;
}

export interface ExpenseHistoryResponse {
    success: boolean;
    data: ExpenseHistoryItem[];
    message?: string;
}
