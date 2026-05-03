import apiClient from './client';

export const apiGetConfig = async (): Promise<{ withdrawalsEnabled: boolean }> => {
  try {
    const response = await apiClient.get('users/config');
    return {
      withdrawalsEnabled: Boolean(response.data?.withdrawalsEnabled ?? true),
    };
  } catch {
    return { withdrawalsEnabled: true };
  }
};
