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
  lockedBob?: number;
  lockedUsd?: number;
  withdrawableUsd?: number;
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
  method?: 'BANK_TRANSFER' | 'CRYPTO';
  credits: number;
  amountBs: number;
  soles?: number;
  currency?: 'BOB' | 'USD';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string | null;
  rejectionReason?: string | null;
  receiptUrl?: string | null;
  txId?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  cryptoAddress?: string | null;
  cryptoCurrency?: string | null;
  cryptoNetwork?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type WalletBalance = {
  // BOB
  balance: number;
  promotionalBalance: number;
  lockedBob: number;
  withdrawableBob: number;
  // USD
  balanceUsd: number;
  lockedUsd: number;
  withdrawableUsd: number;
  // Estado
  debtBob: number;
  debtUsd: number;
  isBlocked: boolean;
};

export const apiGetMyBalance = async (): Promise<WalletBalance> => {
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
  currency?: 'BOB' | 'USD';
  method?: 'BANK_TRANSFER' | 'CRYPTO';
  bankAccountId?: string;
  cryptoAddress?: string;
  cryptoCurrency?: string;
  cryptoNetwork?: string;
}): Promise<WithdrawalRequest> => {
  const response = await apiClient.post('/wallet/me/withdrawal-request', data);
  return response.data;
};

export const apiGetWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  const response = await apiClient.get('/wallet/me/withdrawal-requests');
  return response.data;
};

export interface DebtQrPayment {
  depositId: string;
  qrId: string;
  qrImage: string;
  amountBob: number;
  dueDate: string;
}

export const apiCreateDebtQr = async (): Promise<DebtQrPayment> => {
  const response = await apiClient.post('/baneco-qr/pay-debt');
  return response.data;
};

export interface DebtStripeIntent {
  clientSecret: string;
  ephemeralKey: string;
  amountUsd: number;
}

export const apiCreateDebtStripeIntent = async (): Promise<DebtStripeIntent> => {
  const response = await apiClient.post('/stripe/pay-debt');
  return response.data;
};

export interface PenaltyTransaction {
  id: string;
  createdAt: string;
  totalDeduction: number;
  currency: 'BOB' | 'USD';
  event: string;
  earningReversal: number;
  penaltyPercent: number | null;
  penaltyAmount: number | null;
  sessionTitle: string;
  scheduledStartAt: string | null;
}

export const apiGetPenaltyTransactions = async (): Promise<PenaltyTransaction[]> => {
  const response = await apiClient.get('/wallet/me/penalty-transactions');
  return response.data;
};
