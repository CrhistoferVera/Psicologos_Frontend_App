import apiClient from "../../../api/client";
import type {
  AdminDepositRecord,
  AdminPaginated,
  AdminProfessionalRecord,
  AdminSpecialty,
  AdminStatsResponse,
  AdminUserRecord,
  AdminWithdrawalRecord,
  PromotionalGrantRecord,
} from "../types";

function normalizeError(error: any, fallback: string) {
  const raw = error?.response?.data?.message ?? error?.message;
  if (Array.isArray(raw)) return raw.join(", ");
  if (typeof raw === "string" && raw.trim().length > 0) return raw;
  return fallback;
}

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const response = await apiClient.get("/admin/stats");
  return response.data;
}

export async function getAdminClients(search?: string, cursor?: string, limit = 20): Promise<AdminPaginated<AdminUserRecord>> {
  const response = await apiClient.get("/admin/clients", { params: { search, cursor, limit } });
  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function updateAdminClientStatus(id: string, isActive: boolean) {
  try {
    const response = await apiClient.patch(`/admin/clients/${id}/status`, { isActive });
    return response.data;
  } catch (error: any) {
    throw new Error(normalizeError(error, "No se pudo actualizar el estado del usuario."));
  }
}

export async function getAdminProfessionals(
  search?: string,
  cursor?: string,
  limit = 20,
): Promise<AdminPaginated<AdminProfessionalRecord>> {
  const response = await apiClient.get("/admin/professionals", { params: { search, cursor, limit } });
  const rawRows = Array.isArray(response.data?.data) ? response.data.data : [];
  const data = rawRows.map((row: any) => ({
    ...row,
    professionalProfile: row?.professionalProfile ?? null,
  })) as AdminProfessionalRecord[];
  return {
    data,
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function updateAdminProfessionalStatus(id: string, isActive: boolean) {
  try {
    const response = await apiClient.patch(`/admin/professionals/${id}/status`, { isActive });
    return response.data;
  } catch (error: any) {
    throw new Error(normalizeError(error, "No se pudo actualizar el estado del profesional."));
  }
}

export async function getAdminProfessionalStats(id: string) {
  const response = await apiClient.get(`/admin/stats/professional/${id}`);
  return response.data;
}

export async function getAdminPendingWithdrawalRequests(
  search?: string,
  cursor?: string,
  limit = 20,
): Promise<AdminPaginated<AdminWithdrawalRecord>> {
  const response = await apiClient.get("/admin/professionals/list/withdrawal-requests", {
    params: { search, cursor, limit },
  });
  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function getAdminWithdrawalHistory(
  search?: string,
  cursor?: string,
  limit = 20,
): Promise<AdminPaginated<AdminWithdrawalRecord>> {
  const response = await apiClient.get("/admin/professionals/payment/history", {
    params: { search, cursor, limit },
  });
  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function updateAdminWithdrawalStatus(
  id: string,
  payload: { status: "APPROVED" | "REJECTED"; rejectionReason?: string; receipt?: { uri: string; name?: string; type?: string } },
) {
  const form = new FormData();
  form.append("status", payload.status);
  if (payload.rejectionReason) form.append("rejectionReason", payload.rejectionReason);
  if (payload.receipt) {
    form.append(
      "receipt",
      {
        uri: payload.receipt.uri,
        name: payload.receipt.name ?? `receipt-${id}.jpg`,
        type: payload.receipt.type ?? "image/jpeg",
      } as any,
    );
  }

  try {
    const response = await apiClient.patch(`/admin/payment-requests/${id}/status`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(normalizeError(error, "No se pudo actualizar la solicitud de retiro."));
  }
}

export async function getAdminDeposits(search?: string, cursor?: string, limit = 20): Promise<{ requests: AdminDepositRecord[]; nextCursor: string | null }> {
  const response = await apiClient.get("/admin/deposits", { params: { search, cursor, limit } });
  return {
    requests: Array.isArray(response.data?.requests) ? response.data.requests : [],
    nextCursor: response.data?.nextCursor ?? null,
  };
}

export async function updateAdminDepositStatus(id: string, status: "APPROVED" | "REJECTED", rejectionReason?: string) {
  try {
    const response = await apiClient.patch(`/admin/deposits/${id}/status`, { status, rejectionReason });
    return response.data;
  } catch (error: any) {
    throw new Error(normalizeError(error, "No se pudo actualizar la solicitud de deposito."));
  }
}

export async function getAdminSpecialties(includeInactive = true, search?: string): Promise<AdminSpecialty[]> {
  const response = await apiClient.get("/admin/specialties", {
    params: { includeInactive: includeInactive ? "true" : "false", search },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function createAdminSpecialty(payload: { name: string; description?: string }) {
  try {
    const response = await apiClient.post("/admin/specialties", payload);
    return response.data;
  } catch (error: any) {
    throw new Error(normalizeError(error, "No se pudo crear la especialidad."));
  }
}

export async function updateAdminSpecialty(id: string, payload: { name?: string; description?: string; isActive?: boolean }) {
  try {
    const response = await apiClient.patch(`/admin/specialties/${id}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(normalizeError(error, "No se pudo actualizar la especialidad."));
  }
}

export async function deactivateAdminSpecialty(id: string) {
  try {
    const response = await apiClient.delete(`/admin/specialties/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(normalizeError(error, "No se pudo desactivar la especialidad."));
  }
}

export async function getProfessionalSpecialtiesAdmin(userId: string) {
  const response = await apiClient.get(`/admin/specialties/professionals/${userId}`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function assignProfessionalSpecialtiesAdmin(userId: string, specialtyIds: string[]) {
  try {
    const response = await apiClient.put(`/admin/specialties/professionals/${userId}`, { specialtyIds });
    return response.data;
  } catch (error: any) {
    throw new Error(normalizeError(error, "No se pudieron asignar especialidades."));
  }
}

export async function getPromotionalCreditGrants(limit = 100, recipientUserId?: string): Promise<PromotionalGrantRecord[]> {
  const response = await apiClient.get("/admin/promotional-credits/grants", {
    params: { limit, recipientUserId },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function grantPromotionalCredits(payload: { userId: string; amount: number; reason?: string }) {
  try {
    const response = await apiClient.post("/admin/promotional-credits/grants", payload);
    return response.data;
  } catch (error: any) {
    throw new Error(normalizeError(error, "No se pudieron otorgar créditos promocionales."));
  }
}


export type AdminReferralRecord = {
  id: string;
  status: "PENDING" | "QUALIFIED" | "REWARDED";
  codeUsed: string;
  rewardCredits: number;
  createdAt: string;
  qualifiedAt?: string | null;
  rewardedAt?: string | null;
  referrer: {
    id: string;
    fullName: string;
    email: string | null;
    referralCode: string | null;
  };
  referred: {
    id: string;
    fullName: string;
    email: string | null;
    createdAt: string;
  };
};

export type AdminReferralsResponse = {
  data: AdminReferralRecord[];
  nextCursor: string | null;
  summary: {
    total: number;
    pending: number;
    qualified: number;
    rewarded: number;
    totalRewardCredits: number;
  };
};

export async function getAdminReferrals(params?: {
  status?: "PENDING" | "QUALIFIED" | "REWARDED";
  search?: string;
  cursor?: string;
  limit?: number;
}): Promise<AdminReferralsResponse> {
  const response = await apiClient.get("/admin/referrals", {
    params: {
      status: params?.status,
      search: params?.search,
      cursor: params?.cursor,
      limit: params?.limit ?? 30,
    },
  });

  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    nextCursor: response.data?.nextCursor ?? null,
    summary: {
      total: Number(response.data?.summary?.total ?? 0),
      pending: Number(response.data?.summary?.pending ?? 0),
      qualified: Number(response.data?.summary?.qualified ?? 0),
      rewarded: Number(response.data?.summary?.rewarded ?? 0),
      totalRewardCredits: Number(response.data?.summary?.totalRewardCredits ?? 0),
    },
  };
}

export type AdminConfigPayload = {
  platformFeePercent?: number;
  creditToSolesRate?: number;
  minAppVersion?: string;
  referralRewardCredits?: number;
  referralMinDepositAmount?: number;
  referralEnabled?: boolean;
  paymentsEnabled?: boolean;
  withdrawalsEnabled?: boolean;
};

export async function getAdminConfig(): Promise<Required<AdminConfigPayload>> {
  const response = await apiClient.get("/admin/config");
  return {
    platformFeePercent: Number(response.data?.platformFeePercent ?? 50),
    creditToSolesRate: Number(response.data?.creditToSolesRate ?? 1),
    minAppVersion: String(response.data?.minAppVersion ?? "1.0"),
    referralRewardCredits: Number(response.data?.referralRewardCredits ?? 10),
    referralMinDepositAmount: Number(response.data?.referralMinDepositAmount ?? 0),
    referralEnabled: Boolean(response.data?.referralEnabled ?? true),
    paymentsEnabled: Boolean(response.data?.paymentsEnabled ?? true),
    withdrawalsEnabled: Boolean(response.data?.withdrawalsEnabled ?? true),
  };
}

export async function updateAdminConfig(payload: AdminConfigPayload) {
  try {
    const response = await apiClient.patch("/admin/config", payload);
    return response.data;
  } catch (error: any) {
    throw new Error(normalizeError(error, "No se pudo guardar la configuración."));
  }
}

