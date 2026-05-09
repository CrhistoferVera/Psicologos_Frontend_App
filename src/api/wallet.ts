import apiClient from './client';

export interface EarningTransaction {
  id: string;
  service: string;
  clientName: string;
  amount: number;
  currency?: 'BOB' | 'USD';
  createdAt: string;
}

export interface EarningsData {
  balance: number;
  balanceUsd?: number;
  promotionalBalance?: number;
  realBalance?: number;
  withdrawableBalance?: number;
  withdrawalsEnabled?: boolean;
  today: number;
  todayUsd?: number;
  thisWeek: number;
  thisWeekUsd?: number;
  total: number;
  transactions: EarningTransaction[];
}

export interface Bank {
  id: number;
  name: string;
  logoUrl: string;
}

export interface BankAccount {
  id: string;
  bankId: number;
  bankName: string;
  bankLogoUrl: string;
  accountNumber: string;
  accountHolderName?: string;
  currency?: 'BOB' | 'USD';
}

export interface WithdrawalRequest {
  id: string;
  credits: number;
  amountBs: number;
  soles?: number;
  currency?: 'BOB' | 'USD';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string | null;
  rejectionReason?: string | null;
  receiptUrl?: string | null;
  bankName: string;
  accountNumber: string;
  accountHolderName?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export const apiGetMyBalance = async (): Promise<{
  balance: number;
  balanceUsd: number;
  promotionalBalance: number;
}> => {
  const response = await apiClient.get('/wallet/me/balance');
  return response.data;
};

export const apiGetMyEarnings = async (): Promise<EarningsData> => {
  const response = await apiClient.get('/wallet/me/earnings');
  return response.data;
};

export const apiGetBanks = async (): Promise<Bank[]> => {
  const response = await apiClient.get('/wallet/banks');
  return response.data;
};

export const apiGetBankAccounts = async (): Promise<BankAccount[]> => {
  const response = await apiClient.get('/wallet/me/bank-accounts');
  return response.data;
};

export const apiAddBankAccount = async (data: {
  bankId: number;
  accountNumber: string;
  accountHolderName?: string;
  currency?: 'BOB' | 'USD';
}): Promise<BankAccount> => {
  const response = await apiClient.post('/wallet/me/bank-accounts', data);
  return response.data;
};

export const apiDeleteBankAccount = async (id: string): Promise<void> => {
  await apiClient.delete(`/wallet/me/bank-accounts/${id}`);
};

export const apiCreateWithdrawalRequest = async (data: {
  credits: number;
  bankAccountId: string;
  currency?: 'BOB' | 'USD';
}): Promise<WithdrawalRequest> => {
  const response = await apiClient.post('/wallet/me/withdrawal-request', data);
  return response.data;
};

export const apiGetWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  const response = await apiClient.get('/wallet/me/withdrawal-requests');
  return response.data;
};
