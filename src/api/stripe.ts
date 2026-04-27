import apiClient from './client';

export const apiCreatePaymentIntent = async (packageId: string, saveCard = false): Promise<{ clientSecret: string; customerId: string }> => {
    try {
        const response = await apiClient.post<{ clientSecret: string; customerId: string }>('/stripe/create-payment-intent', { packageId, saveCard });
        return response.data;
    } catch (error: any) {
        throw error?.response?.data || error;
    }
};

export const apiCreateEphemeralKey = async (): Promise<{ secret: string }> => {
    try {
        const response = await apiClient.post<{ secret: string }>('/stripe/ephemeral-key');
        return response.data;
    } catch (error: any) {
        throw error?.response?.data || error;
    }
};

export const apiGetSavedPaymentMethods = async () => {
    try {
        const response = await apiClient.get('/stripe/payment-methods');
        return response.data;
    } catch (error: any) {
        throw error?.response?.data || error;
    }
};
