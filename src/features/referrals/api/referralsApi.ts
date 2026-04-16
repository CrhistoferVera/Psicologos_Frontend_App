import apiClient from "../../../api/client";

export type ReferralSummary = {
  code: string;
  invitedCount: number;
  bonusCredits: number;
};

export async function getReferralSummary(userId?: string): Promise<ReferralSummary> {
  try {
    const response = await apiClient.get("/referrals/me");
    const data = response.data ?? {};
    return {
      code: String(data.code ?? data.referralCode ?? ""),
      invitedCount: Number(data.invitedCount ?? data.totalInvites ?? 0),
      bonusCredits: Number(data.bonusCredits ?? data.totalBonusCredits ?? 0),
    };
  } catch (error: any) {
    // TODO(backend): expose stable referrals endpoint for user MVP.
    // Keep deterministic fallback only when endpoint is not implemented yet.
    if (error?.response?.status !== 404) {
      throw error;
    }
    const prefix = userId ? userId.slice(0, 6).toUpperCase() : "PSI001";
    return {
      code: `SALUD-${prefix}`,
      invitedCount: 0,
      bonusCredits: 0,
    };
  }
}

