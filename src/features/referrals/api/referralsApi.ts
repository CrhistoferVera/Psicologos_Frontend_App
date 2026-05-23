import apiClient from "../../../api/client";

export type ReferralReward = {
  id: string;
  type: "SESSION" | "PACKAGE";
  case: "PRO_TO_PRO" | "PRO_TO_USER" | "USER_TO_USER";
  currency: string;
  sourceAmount: number;
  rewardPercent: number;
  rewardAmount: number;
  createdAt: string;
};

export type ReferralHistoryItem = {
  id: string;
  status: "PENDING" | "QUALIFIED";
  referrerRole: string;
  referredRole: string;
  case: "PRO_TO_PRO" | "PRO_TO_USER" | "USER_TO_USER" | null;
  rewardPaidAt: string | null;
  createdAt: string;
  qualifiedAt: string | null;
  codeUsed: string;
  totalRewardsEarned: number;
  rewards: ReferralReward[];
  referred: {
    id: string;
    fullName: string;
    email: string | null;
    role: string;
    createdAt: string;
  };
};

export type ReferralRules = {
  referralRewardPercent: number;
};

export type MyReferralsData = {
  code: string;
  role: string | null;
  invitedCount: number;
  totalRewardsEarned: number;
  rules: ReferralRules;
  history: ReferralHistoryItem[];
};

export async function getMyReferrals(): Promise<MyReferralsData> {
  const response = await apiClient.get("/referrals/me");
  const data = response.data ?? {};

  const history: ReferralHistoryItem[] = Array.isArray(data.history)
    ? data.history.map((item: any) => ({
        id: String(item.id ?? ""),
        status: item.status ?? "PENDING",
        referrerRole: String(item.referrerRole ?? ""),
        referredRole: String(item.referredRole ?? ""),
        case: item.case ?? null,
        rewardPaidAt: item.rewardPaidAt ?? null,
        createdAt: item.createdAt ?? "",
        qualifiedAt: item.qualifiedAt ?? null,
        codeUsed: item.codeUsed ?? "",
        totalRewardsEarned: Number(item.totalRewardsEarned ?? 0),
        rewards: Array.isArray(item.rewards)
          ? item.rewards.map((r: any) => ({
              id: String(r.id ?? ""),
              type: r.type ?? "SESSION",
              case: r.case ?? null,
              currency: String(r.currency ?? "BOB"),
              sourceAmount: Number(r.sourceAmount ?? 0),
              rewardPercent: Number(r.rewardPercent ?? 0),
              rewardAmount: Number(r.rewardAmount ?? 0),
              createdAt: r.createdAt ?? "",
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
    role: data.role ?? null,
    invitedCount: Number(data.invitedCount ?? 0),
    totalRewardsEarned: Number(data.totalRewardsEarned ?? 0),
    rules: {
      referralRewardPercent: Number(data.rules?.referralRewardPercent ?? 5),
    },
    history,
  };
}

/** Alias para compatibilidad con código existente */
export async function getReferralSummary() {
  const data = await getMyReferrals();
  return { code: data.code, invitedCount: data.invitedCount, bonusCredits: data.totalRewardsEarned };
}
