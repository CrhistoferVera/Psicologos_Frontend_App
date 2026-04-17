import { Platform } from "react-native";

const fallbackRemoteApi = "https://caja-negra-psico-back.wkhbmg.easypanel.host/";

const webApiUrl = process.env.EXPO_PUBLIC_API_URL_WEB;
const nativeApiUrl = process.env.EXPO_PUBLIC_API_URL_NATIVE;
const sharedApiUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_URL =
  Platform.OS === "web"
    ? webApiUrl ?? sharedApiUrl ?? "http://localhost:4000"
    : nativeApiUrl ?? sharedApiUrl ?? fallbackRemoteApi;

export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID;