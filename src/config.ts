import { Platform } from "react-native"; 

const fallbackRemoteApi = "https://caja-negra-psico-back.wkhbmg.easypanel.host/";
const webApiUrl = process.env.EXPO_PUBLIC_API_URL_WEB;
const nativeApiUrl = process.env.EXPO_PUBLIC_API_URL_NATIVE;
const sharedApiUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_URL =
  Platform.OS === "web"
    ? webApiUrl ?? sharedApiUrl ?? fallbackRemoteApi
    : nativeApiUrl ?? sharedApiUrl ?? fallbackRemoteApi;

export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID;
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
export const GOOGLE_EXPO_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? "";
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

// Tipo de cambio: 7 Bs = 1 USD
export const BS_PER_USD = Number(process.env.EXPO_PUBLIC_BS_PER_USD ?? 7);

// Bonus de créditos para pagos con Stripe (35%)
export const STRIPE_CREDITS_BONUS = Number(process.env.EXPO_PUBLIC_STRIPE_CREDITS_BONUS ?? 0.35);
