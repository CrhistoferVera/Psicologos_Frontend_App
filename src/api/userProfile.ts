import apiClient from './client';
import { MyProfileData } from '../types/userProfile';

// GET /users/my/profile
export const apiGetMyProfileUser = async (): Promise<MyProfileData> => {
    const response = await apiClient.get('/users/my/profile');
    return response.data;
};

export const apiUpdateMyProfileUser = async (payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    userName?: string;
    bio?: string;
    avatar?: { uri?: string; name?: string; type?: string; file?: File };
}): Promise<MyProfileData> => {
    const form = new FormData();

    if (payload.firstName !== undefined) form.append('firstName', payload.firstName);
    if (payload.lastName !== undefined) form.append('lastName', payload.lastName);
    if (payload.email !== undefined) form.append('email', payload.email);
    if (payload.phoneNumber !== undefined) form.append('phoneNumber', payload.phoneNumber);
    if (payload.userName !== undefined) form.append('userName', payload.userName);
    if (payload.bio !== undefined) form.append('bio', payload.bio);

    if (payload.avatar) {
        if (payload.avatar.file) {
            form.append('avatar', payload.avatar.file as any);
        } else if (payload.avatar.uri) {
            form.append('avatar', {
                uri: payload.avatar.uri,
                name: payload.avatar.name ?? 'avatar.jpg',
                type: payload.avatar.type ?? 'image/jpeg',
            } as any);
        }
    }

    const response = await apiClient.patch('/users/my/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const apiSetMyCountry = async (country: string): Promise<{ id: string; country: string | null }> => {
    const response = await apiClient.patch('/users/me/country', { country });
    return response.data;
};

// ACTUALIZAR FCM TOKEN
//para actualizar el token de FCM en el backend cada vez que se registre o se refresque el token en el dispositivo del usuario
export const apiUpdateFcmToken = async (fcmToken: string): Promise<void> => {
    try {
        await apiClient.patch('/users/fcm-token', { fcmToken });
    } catch (error: any) {
        console.error('Error actualizando FCM token:', error);
    }
};

