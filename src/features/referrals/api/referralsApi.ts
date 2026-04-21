import apiClient from "../../../api/client";

export type ReferralRewardEvent = {
  id: string;
  rewardAmount: number;
  percentageApplied: number;
  createdAt: string;
};

export type ReferralHistoryItem = {
  id: string;
  status: "PENDING" | "ACTIVE" | "QUALIFIED" | "REWARDED";
  createdAt: string;
  qualifiedAt: string | null;
  rewardedAt: string | null;
  codeUsed: string;
  totalRewardCredits: number;
  rewardEvents: ReferralRewardEvent[];
  referred: {
    id: string;
    fullName: string;
    email: string | null;
    role: string;
    createdAt: string;
  };
};

export type ReferralStats = {
  pending: number;
  active: number;
  qualified: number;
  rewarded: number;
};

export type MyReferralsData = {
  code: string;
  invitedCount: number;
  bonusCredits: number;
  stats: ReferralStats;
  history: ReferralHistoryItem[];
};

export async function getMyReferrals(): Promise<MyReferralsData> {
  const response = await apiClient.get("/referrals/me");
  const data = response.data ?? {};

  const history: ReferralHistoryItem[] = Array.isArray(data.history)
    ? data.history.map((item: any) => ({
        id: String(item.id ?? ""),
        status: item.status ?? "PENDING",
        createdAt: item.createdAt ?? "",
        qualifiedAt: item.qualifiedAt ?? null,
        rewardedAt: item.rewardedAt ?? null,
        codeUsed: item.codeUsed ?? "",
        totalRewardCredits: Number(item.totalRewardCredits ?? 0),
        rewardEvents: Array.isArray(item.rewardEvents)
          ? item.rewardEvents.map((e: any) => ({
              id: String(e.id ?? ""),
              rewardAmount: Number(e.rewardAmount ?? 0),
              percentageApplied: Number(e.percentageApplied ?? 0),
              createdAt: e.createdAt ?? "",
            }))
          : [],
        referred: {
          id: String(item.referred?.id ?? ""),
          fullName: String(item.referred?.fullName ?? ""),
          email: item.referred?.email ?? null,
          role: String(item.referred?.role ?? ""),
          createdAt: String(item.referred?.createdAt ?? ""),
        },
      }))
    : [];

  return {
    code: String(data.code ?? data.referralCode ?? ""),
    invitedCount: Number(data.invitedCount ?? data.totalInvites ?? 0),
    bonusCredits: Number(data.bonusCredits ?? data.totalBonusCredits ?? 0),
    stats: {
      pending: Number(data.stats?.pending ?? 0),
      active: Number(data.stats?.active ?? 0),
      qualified: Number(data.stats?.qualified ?? 0),
      rewarded: Number(data.stats?.rewarded ?? 0),
    },
    history,
  };
}

/** Alias para compatibilidad con código existente */
export async function getReferralSummary() {
  const data = await getMyReferrals();
  return { code: data.code, invitedCount: data.invitedCount, bonusCredits: data.bonusCredits };
}
