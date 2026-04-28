import apiClient from './client';

export type BanecoQrCreateResponse = {
  depositId: string;
  qrId: string;
  qrImage: string; // base64 PNG
  amount: number;
  currency: 'BOB' | 'USD';
  credits: number;
  packageName: string;
  dueDate: string;
};

export type BanecoQrStatus = 'PENDING' | 'PAID' | 'CANCELED';

export const apiCreateBanecoQr = async (packageId: string): Promise<BanecoQrCreateResponse> => {
  try {
    const res = await apiClient.post<BanecoQrCreateResponse>('/baneco-qr/create', { packageId });
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || error;
  }
};

export const apiGetBanecoQrStatus = async (
  qrId: string,
): Promise<{ status: BanecoQrStatus; depositId: string }> => {
  try {
    const res = await apiClient.get<{ status: BanecoQrStatus; depositId: string }>(
      `/baneco-qr/status/${encodeURIComponent(qrId)}`,
    );
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || error;
  }
};

export const apiCancelBanecoQr = async (qrId: string): Promise<{ ok: boolean }> => {
  try {
    const res = await apiClient.delete<{ ok: boolean }>(
      `/baneco-qr/cancel/${encodeURIComponent(qrId)}`,
    );
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || error;
  }
};
