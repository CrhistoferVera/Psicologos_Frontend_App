import apiClient from './client';

export const apiGetConfig = async (): Promise<{
  withdrawalsEnabled: boolean;
  usdExchangeRate: number;
  noShowGraceMinutes: number;
}> => {
  try {
    const response = await apiClient.get('users/config');
    return {
      withdrawalsEnabled: Boolean(response.data?.withdrawalsEnabled ?? true),
      usdExchangeRate: Number(response.data?.usdExchangeRate ?? response.data?.bobToUsdRate ?? 6.96),
      noShowGraceMinutes: Number(response.data?.noShowGraceMinutes ?? 15),
    };
  } catch {
    return { withdrawalsEnabled: true, usdExchangeRate: 6.96, noShowGraceMinutes: 15 };
  }
};
