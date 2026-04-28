import apiClient from './client';

export type ServiceType = 'MESSAGE' | 'MESSAGE_SEND' | 'CALL' | 'VIDEO_CALL';

export type ServicePrice = {
  id: string;
  profileId: string;
  serviceType: ServiceType;
  price: number;
  createdAt: string;
  updatedAt: string;
};

// GET /service-prices: obtiene todos los precios de la profesional
export const apiGetMyServicePrices = async (): Promise<ServicePrice[]> => {
  const response = await apiClient.get('/service-prices');
  return response.data;
};

// GET /service-prices/public/:userId: precios públicos de una profesional (sin auth)
export const apiGetPublicServicePrices = async (professionalUserId: string): Promise<ServicePrice[]> => {
  const response = await apiClient.get(`/service-prices/public/${professionalUserId}`);
  return response.data;
};

// PUT /service-prices: crea o actualiza un precio
export const apiUpsertServicePrice = async (
  serviceType: ServiceType,
  price: number,
): Promise<ServicePrice> => {
  const response = await apiClient.put('/service-prices', { serviceType, price });
  return response.data;
};

