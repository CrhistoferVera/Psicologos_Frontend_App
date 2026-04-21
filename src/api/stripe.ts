import apiClient from './client';

export const apiCreatePaymentIntent = async (packageId: string): Promise<{ clientSecret: string }> => {
    try {
        const response = await apiClient.post<{ clientSecret: string }>('/stripe/create-payment-intent', { packageId });
        return response.data;
    } catch (error: any) {
        throw error?.response?.data || error;
    }
};
