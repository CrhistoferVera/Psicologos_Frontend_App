import apiClient from "../../../api/client";

export type ReferralRewardEvent = {
  id: string;
  rewardAmount: number;
  percentageApplied: number;
  bonusPercentApplied?: number;
  createdAt: string;
};

export type ReferralHistoryItem = {
  id: string;
  status: "PENDING" | "ACTIVE" | "QUALIFIED" | "REWARDED";
  createdAt: string;
  qualifiedAt: string | null;
  rewardedAt: string | null;
  codeUsed: string;
  validPurchasesCount?: number;
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

export type ReferralRules = {
  validPurchasesRequired: number;
  threshold: number;
  clientDiscountPercent: number;
  clientDiscountSessions: number;
  professionalRewardPercent: number;
};

export type ReferralProgress = {
  valid: number;
  threshold: number;
  pending: number;
  cyclesUnlocked: number;
};

export type ClientReferralBenefit = {
  activeBenefits: number;
  remainingDiscountSessions: number;
  benefits: Array<{
    id: string;
    cycleNumber: number;
    status: string;
    discountPercent: number;
    totalSessions: number;
    remainingSessions: number;
    createdAt: string;
    activatedAt: string;
    consumedAt: string | null;
  }>;
};

export type ProfessionalReferralBenefit = {
  activeBeneficiaries: number;
  beneficiaries: Array<{
    id: string;
    referredUserId: string;
    rewardPercent: number;
    activatedAt: string;
    referredUser: {
      id: string;
      fullName: string;
      email: string | null;
      role: string;
    };
  }>;
  rewardsHistory: Array<{
    id: string;
    currency: string;
    sourceAmount: number;
    rewardPercent: number;
    rewardAmount: number;
    createdAt: string;
    reversedAt: string | null;
    referred: {
      id: string;
      fullName: string;
      email: string | null;
    };
  }>;
};

export type ReferralStats = {
  pending: number;
  active: number;
  qualified: number;
  rewarded: number;
  valid?: number;
};

export type MyReferralsData = {
  code: string;
  role: string | null;
  invitedCount: number;
  validReferralsCount: number;
  pendingReferralsCount: number;
  bonusCredits: number;
  rules: ReferralRules;
  progress: ReferralProgress;
  clientBenefit: ClientReferralBenefit | null;
  professionalBenefit: ProfessionalReferralBenefit | null;
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
        validPurchasesCount: Number(item.validPurchasesCount ?? 0),
        totalRewardCredits: Number(item.totalRewardCredits ?? 0),
        rewardEvents: Array.isArray(item.rewardEvents)
          ? item.rewardEvents.map((e: any) => ({
              id: String(e.id ?? ""),
              rewardAmount: Number(e.rewardAmount ?? 0),
              percentageApplied: Number(e.percentageApplied ?? 0),
              bonusPercentApplied: Number(e.bonusPercentApplied ?? 0),
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
    role: data.role ?? null,
    invitedCount: Number(data.invitedCount ?? data.totalInvites ?? 0),
    validReferralsCount: Number(data.validReferralsCount ?? data.stats?.valid ?? 0),
    pendingReferralsCount: Number(data.pendingReferralsCount ?? data.stats?.pending ?? 0),
    bonusCredits: Number(data.bonusCredits ?? data.totalBonusCredits ?? 0),
    rules: {
      validPurchasesRequired: Number(data.rules?.validPurchasesRequired ?? 1),
      threshold: Number(data.rules?.threshold ?? 10),
      clientDiscountPercent: Number(data.rules?.clientDiscountPercent ?? 5),
      clientDiscountSessions: Number(data.rules?.clientDiscountSessions ?? 10),
      professionalRewardPercent: Number(data.rules?.professionalRewardPercent ?? 5),
    },
    progress: {
      valid: Number(data.progress?.valid ?? data.validReferralsCount ?? 0),
      threshold: Number(data.progress?.threshold ?? data.rules?.threshold ?? 10),
      pending: Number(data.progress?.pending ?? data.pendingReferralsCount ?? 0),
      cyclesUnlocked: Number(data.progress?.cyclesUnlocked ?? 0),
    },
    clientBenefit: data.clientBenefit
      ? {
          activeBenefits: Number(data.clientBenefit.activeBenefits ?? 0),
          remainingDiscountSessions: Number(data.clientBenefit.remainingDiscountSessions ?? 0),
          benefits: Array.isArray(data.clientBenefit.benefits)
            ? data.clientBenefit.benefits.map((benefit: any) => ({
                id: String(benefit.id ?? ""),
                cycleNumber: Number(benefit.cycleNumber ?? 0),
                status: String(benefit.status ?? ""),
                discountPercent: Number(benefit.discountPercent ?? 0),
                totalSessions: Number(benefit.totalSessions ?? 0),
                remainingSessions: Number(benefit.remainingSessions ?? 0),
                createdAt: String(benefit.createdAt ?? ""),
                activatedAt: String(benefit.activatedAt ?? ""),
                consumedAt: benefit.consumedAt ? String(benefit.consumedAt) : null,
              }))
            : [],
        }
      : null,
    professionalBenefit: data.professionalBenefit
      ? {
          activeBeneficiaries: Number(data.professionalBenefit.activeBeneficiaries ?? 0),
          beneficiaries: Array.isArray(data.professionalBenefit.beneficiaries)
            ? data.professionalBenefit.beneficiaries.map((beneficiary: any) => ({
                id: String(beneficiary.id ?? ""),
                referredUserId: String(beneficiary.referredUserId ?? ""),
                rewardPercent: Number(beneficiary.rewardPercent ?? 0),
                activatedAt: String(beneficiary.activatedAt ?? ""),
                referredUser: {
                  id: String(beneficiary.referredUser?.id ?? ""),
                  fullName: String(beneficiary.referredUser?.fullName ?? ""),
                  email: beneficiary.referredUser?.email ?? null,
                  role: String(beneficiary.referredUser?.role ?? ""),
                },
              }))
            : [],
          rewardsHistory: Array.isArray(data.professionalBenefit.rewardsHistory)
            ? data.professionalBenefit.rewardsHistory.map((reward: any) => ({
                id: String(reward.id ?? ""),
                currency: String(reward.currency ?? ""),
                sourceAmount: Number(reward.sourceAmount ?? 0),
                rewardPercent: Number(reward.rewardPercent ?? 0),
                rewardAmount: Number(reward.rewardAmount ?? 0),
                createdAt: String(reward.createdAt ?? ""),
                reversedAt: reward.reversedAt ? String(reward.reversedAt) : null,
                referred: {
                  id: String(reward.referred?.id ?? ""),
                  fullName: String(reward.referred?.fullName ?? ""),
                  email: reward.referred?.email ?? null,
                },
              }))
            : [],
        }
      : null,
    stats: {
      pending: Number(data.stats?.pending ?? 0),
      active: Number(data.stats?.active ?? 0),
      qualified: Number(data.stats?.qualified ?? 0),
      rewarded: Number(data.stats?.rewarded ?? 0),
      valid: Number(data.stats?.valid ?? data.validReferralsCount ?? 0),
    },
    history,
  };
}

/** Alias para compatibilidad con código existente */
export async function getReferralSummary() {
  const data = await getMyReferrals();
  return { code: data.code, invitedCount: data.invitedCount, bonusCredits: data.bonusCredits };
}
