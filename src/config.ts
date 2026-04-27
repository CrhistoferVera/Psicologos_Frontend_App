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
