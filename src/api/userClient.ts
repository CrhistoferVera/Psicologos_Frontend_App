import apiClient from './client';

export interface WalletResponse {
  success: boolean;
  balance: number;
  promotionalBalance?: number;
  realBalance?: number;
  userId: string;
  updatedAt: string;
}

function parseApiError(error: any, fallback: string) {
  const rawMessage = error?.response?.data?.message ?? error?.message;
  if (Array.isArray(rawMessage)) return rawMessage.join(', ');
  if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) return rawMessage;
  return fallback;
}

export const apiGetConfig = async (): Promise<{ creditToSolesRate: number; creditValueBs: number; withdrawalsEnabled: boolean }> => {
  try {
    const response = await apiClient.get('users/config');
    const creditValueBs = Number(response.data?.creditValueBs ?? response.data?.creditToSolesRate ?? 1);
    return {
      creditValueBs,
      creditToSolesRate: creditValueBs,
      withdrawalsEnabled: Boolean(response.data?.withdrawalsEnabled ?? true),
    };
  } catch {
    return { creditToSolesRate: 1, creditValueBs: 1, withdrawalsEnabled: true };
  }
};

export const apiGetUserWallet = async (userId: string): Promise<WalletResponse> => {
  try {
    const response = await apiClient.get(`users/${userId}/wallet`);
    return response.data;
  } catch (error: any) {
    throw new Error(parseApiError(error, 'No se pudo cargar el saldo del cliente'));
  }
};

export const apiGetMyWallet = async (): Promise<WalletResponse> => {
  try {
    const response = await apiClient.get('users/wallet');
    return response.data;
  } catch (error: any) {
    throw new Error(parseApiError(error, 'No se pudo cargar el saldo de la billetera'));
  }
};
