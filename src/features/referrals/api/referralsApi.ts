import apiClient from "../../../api/client";

export type ReferralSummary = {
  code: string;
  invitedCount: number;
  bonusCredits: number;
};

export async function getReferralSummary(): Promise<ReferralSummary> {
  const response = await apiClient.get("/referrals/me");
  const data = response.data ?? {};
  return {
    code: String(data.code ?? data.referralCode ?? ""),
    invitedCount: Number(data.invitedCount ?? data.totalInvites ?? 0),
    bonusCredits: Number(data.bonusCredits ?? data.totalBonusCredits ?? 0),
  };
}
