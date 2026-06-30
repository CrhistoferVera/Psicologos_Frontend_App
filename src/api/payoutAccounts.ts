import apiClient from './client';

export type RefundMethod = 'BANK_TRANSFER' | 'CRYPTO';

export type ClientPayoutAccount = {
  id: string;
  method: RefundMethod;
  isDefault: boolean;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  cryptoAddress?: string | null;
  cryptoCurrency?: string | null;
  cryptoNetwork?: string | null;
  createdAt: string;
};

export type CreatePayoutAccountPayload =
  | {
      method: 'BANK_TRANSFER';
      isDefault?: boolean;
      bankName: string;
      bankAccountNumber: string;
      bankAccountHolder: string;
    }
  | {
      method: 'CRYPTO';
      isDefault?: boolean;
      cryptoAddress: string;
      cryptoCurrency: string;
      cryptoNetwork: string;
    };

export async function getPayoutAccounts(): Promise<ClientPayoutAccount[]> {
  const res = await apiClient.get<ClientPayoutAccount[]>('/client/payout-accounts');
  return res.data;
}

export async function createPayoutAccount(
  payload: CreatePayoutAccountPayload,
): Promise<ClientPayoutAccount> {
  const res = await apiClient.post<ClientPayoutAccount>('/client/payout-accounts', payload);
  return res.data;
}

export async function deletePayoutAccount(id: string): Promise<void> {
  await apiClient.delete(`/client/payout-accounts/${id}`);
}
