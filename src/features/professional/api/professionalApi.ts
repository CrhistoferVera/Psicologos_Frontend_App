import apiClient from "../../../api/client";
import {
  apiAddBankAccount,
  apiCreateWithdrawalRequest,
  apiDeleteBankAccount,
  apiGetBankAccounts,
  apiGetBanks,
  apiGetMyEarnings,
  apiGetWithdrawalRequests,
  type Bank,
  type BankAccount,
  type EarningsData,
  type WithdrawalRequest,
} from "../../../api/wallet";
import { apiGetMyServicePrices, apiUpsertServicePrice, type ServicePrice } from "../../../api/servicePrices";
import { getMyChats, type Chat } from "../../../api/messages";
import { sendOtp, verifyOtp } from "../../../services/auth";
import type {
  ProfessionalChatItem,
  ProfessionalPriceInput,
  ProfessionalProfile,
  ProfessionalRegisterPayload,
  ProfessionalStatsSummary,
} from "../types";

export type SpecialtyCatalogItem = {
  id: string;
  name: string;
  slug?: string;
};

export type ProfessionalReviewStatusResponse = {
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  isActive: boolean;
  updatedAt: string | null;
};

export type ProfessionalAvailability = {
  monFri?: string;
  sat?: string;
  sun?: string;
  [key: string]: unknown;
};

function normalizeProfile(raw: any): ProfessionalProfile {
  return {
    id: String(raw?.id ?? ""),
    firstName: String(raw?.firstName ?? ""),
    lastName: String(raw?.lastName ?? ""),
    username: String(raw?.username ?? ""),
    bio: String(raw?.bio ?? ""),
    isOnline: Boolean(raw?.isOnline ?? false),
    avatarUrl: raw?.avatarUrl ?? null,
    coverUrl: raw?.coverUrl ?? null,
    rateCredits: typeof raw?.rateCredits === "number" ? raw.rateCredits : undefined,
    reviewStatus: (raw?.reviewStatus as any) ?? "PENDING",
    reviewNotes: raw?.reviewNotes ?? null,
    availability: (raw?.availability as ProfessionalAvailability | null) ?? null,
  };
}

function toPriceInput(prices: ServicePrice[]): ProfessionalPriceInput {
  const input: ProfessionalPriceInput = { chat: 0, call: 0, video: 0 };
  for (const price of prices) {
    if (price.serviceType === "MESSAGE_SEND" || price.serviceType === "MESSAGE") input.chat = Number(price.price ?? 0);
    if (price.serviceType === "CALL") input.call = Number(price.price ?? 0);
    if (price.serviceType === "VIDEO_CALL") input.video = Number(price.price ?? 0);
  }
  return input;
}


export async function sendProfessionalVerificationOtp(phoneNumber: string) {
  return sendOtp(phoneNumber);
}

export async function verifyProfessionalOtp(phoneNumber: string, code: string): Promise<string> {
  const result = await verifyOtp(phoneNumber, code);
  if ("needsProfile" in result && result.needsProfile && result.tempToken) {
    return result.tempToken;
  }
  throw new Error("Este número ya tiene una cuenta activa. Inicia sesión.");
}

export async function completeProfessionalRegistration(payload: ProfessionalRegisterPayload) {
  const form = new FormData();
  form.append("tempToken", payload.tempToken);
  form.append("firstName", payload.firstName);
  form.append("lastName", payload.lastName);
  form.append("email", payload.email);
  form.append("password", payload.password);
  form.append("confirmPassword", payload.confirmPassword);
  form.append("username", payload.username);
  form.append("dateOfBirth", payload.dateOfBirth);
  form.append("cedula", payload.cedula);

  if (payload.idDoc) {
    form.append(
      "idDoc",
      {
        uri: payload.idDoc.uri,
        name: payload.idDoc.name,
        type: payload.idDoc.type,
      } as any,
    );
  }

  const response = await apiClient.post("/auth/complete-professional-registration", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function getMyProfessionalProfile(): Promise<ProfessionalProfile> {
  const response = await apiClient.get("/professionals/me/profile");
  const data = response.data;
  return normalizeProfile(data);
}

export async function getMyProfessionalReviewStatus(): Promise<ProfessionalReviewStatusResponse> {
  try {
    const response = await apiClient.get("/professionals/me/review-status");
    const data = response.data ?? {};
    return {
      status: (data.status as any) ?? "PENDING",
      notes: data.notes ?? null,
      isActive: Boolean(data.isActive ?? false),
      updatedAt: data.updatedAt ?? null,
    };
  } catch (error: any) {
    if (error?.response?.status !== 404) throw error;
    const profile = await getMyProfessionalProfile();
    return {
      status: (profile.reviewStatus as any) ?? "PENDING",
      notes: profile.reviewNotes ?? null,
      isActive: true,
      updatedAt: null,
    };
  }
}

export async function updateMyProfessionalProfile(
  payload: {
    firstName?: string;
    lastName?: string;
    username?: string;
    bio?: string;
    isOnline?: boolean;
    availability?: ProfessionalAvailability;
  },
  avatarFile?: { uri: string; name: string; type: string },
  coverFile?: { uri: string; name: string; type: string },
): Promise<ProfessionalProfile> {
  const formData = new FormData();
  if (payload.firstName !== undefined) formData.append("firstName", payload.firstName);
  if (payload.lastName !== undefined) formData.append("lastName", payload.lastName);
  if (payload.username !== undefined) formData.append("username", payload.username);
  if (payload.bio !== undefined) formData.append("bio", payload.bio);
  if (payload.isOnline !== undefined) formData.append("isOnline", String(payload.isOnline));
  if (payload.availability !== undefined) formData.append("availability", JSON.stringify(payload.availability));

  if (avatarFile) {
    formData.append("avatar", { uri: avatarFile.uri, name: avatarFile.name, type: avatarFile.type } as any);
  }
  if (coverFile) {
    formData.append("cover", { uri: coverFile.uri, name: coverFile.name, type: coverFile.type } as any);
  }

  const response = await apiClient.patch("/professionals/me/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeProfile(response.data);
}

export async function getMyProfessionalPrices(): Promise<ProfessionalPriceInput> {
  const prices = await apiGetMyServicePrices();
  return toPriceInput(prices);
}

export async function upsertProfessionalPrices(input: ProfessionalPriceInput) {
  const tasks: Promise<unknown>[] = [];
  if (Number.isFinite(input.chat)) tasks.push(apiUpsertServicePrice("MESSAGE_SEND", Number(input.chat || 0)));
  if (Number.isFinite(input.call)) tasks.push(apiUpsertServicePrice("CALL", Number(input.call || 0)));
  if (Number.isFinite(input.video)) tasks.push(apiUpsertServicePrice("VIDEO_CALL", Number(input.video || 0)));
  await Promise.all(tasks);
}

export async function getProfessionalSpecialtiesCatalog(): Promise<SpecialtyCatalogItem[]> {
  try {
    const response = await apiClient.get("/professionals/me/specialties/catalog");
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((item: any) => ({
      id: String(item.id),
      name: String(item.name),
      slug: item.slug ? String(item.slug) : undefined,
    }));
  } catch (error: any) {
    if (error?.response?.status !== 404) throw error;
    const response = await apiClient.get("/specialties/public");
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map((item: any) => ({
      id: String(item.id),
      name: String(item.name),
      slug: item.slug ? String(item.slug) : undefined,
    }));
  }
}

export async function getMyProfessionalSpecialtyIds(): Promise<string[]> {
  try {
    const response = await apiClient.get("/professionals/me/specialties");
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows
      .map((item: any) => String(item?.specialty?.id ?? item?.specialtyId ?? ""))
      .filter(Boolean);
  } catch (error: any) {
    if (error?.response?.status === 404) return [];
    throw error;
  }
}

export async function updateMyProfessionalSpecialties(specialtyIds: string[]): Promise<string[]> {
  const unique = Array.from(new Set(specialtyIds.filter(Boolean)));
  const response = await apiClient.put("/professionals/me/specialties", { specialtyIds: unique });
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows
    .map((item: any) => String(item?.specialty?.id ?? item?.specialtyId ?? ""))
    .filter(Boolean);
}

export async function getProfessionalChats(): Promise<ProfessionalChatItem[]> {
  const chats: Chat[] = await getMyChats();
  return chats.map((chat) => ({
    conversationId: chat.conversationId,
    otherUserId: chat.otherUserId,
    otherUserName: chat.otherUserName,
    otherUserAvatar: chat.otherUserAvatar,
    lastMessage: chat.lastMessage,
    lastMessageAt: chat.lastMessageAt,
    unreadCount: chat.unreadCount,
  }));
}

export async function getProfessionalDashboardSnapshot(): Promise<{
  profile: ProfessionalProfile;
  earnings: EarningsData;
  chats: ProfessionalChatItem[];
  summary: ProfessionalStatsSummary;
}> {
  const [profile, earnings, chats] = await Promise.all([
    getMyProfessionalProfile(),
    apiGetMyEarnings(),
    getProfessionalChats(),
  ]);

  const summary: ProfessionalStatsSummary = {
    totalBalance: Number(earnings.balance ?? 0),
    today: Number(earnings.today ?? 0),
    thisWeek: Number(earnings.thisWeek ?? 0),
    totalTransactions: Array.isArray(earnings.transactions) ? earnings.transactions.length : 0,
    unreadChats: chats.reduce((acc, chat) => acc + Number(chat.unreadCount ?? 0), 0),
  };

  return { profile, earnings, chats, summary };
}

export async function getProfessionalEarningsData() {
  return apiGetMyEarnings();
}

export async function getProfessionalBanks(): Promise<Bank[]> {
  return apiGetBanks();
}

export async function getProfessionalBankAccounts(): Promise<BankAccount[]> {
  return apiGetBankAccounts();
}

export async function addProfessionalBankAccount(payload: {
  bankId: number;
  accountNumber: string;
  accountHolderName?: string;
}) {
  return apiAddBankAccount(payload);
}

export async function removeProfessionalBankAccount(id: string) {
  return apiDeleteBankAccount(id);
}

export async function requestProfessionalWithdrawal(payload: { credits: number; bankAccountId: string }) {
  return apiCreateWithdrawalRequest(payload);
}

export async function getProfessionalWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  return apiGetWithdrawalRequests();
}


