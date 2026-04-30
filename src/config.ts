const fallbackApiUrl = "http://localhost:4000";

const nativeApiUrl = process.env.EXPO_PUBLIC_API_URL_NATIVE;
const sharedApiUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_URL = (nativeApiUrl ?? sharedApiUrl ?? fallbackApiUrl).replace(/\/$/, "");
export const APP_DOWNLOAD_URL =
  process.env.EXPO_PUBLIC_APP_DOWNLOAD_URL ??
  process.env.EXPO_PUBLIC_WEB_APP_URL ??
  "https://app.sanamente.app/#descargar";
export const ADMIN_WEB_URL =
  process.env.EXPO_PUBLIC_ADMIN_WEB_URL ??
  process.env.EXPO_PUBLIC_WEB_APP_URL ??
  "";

export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID;
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
export const GOOGLE_EXPO_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? "";
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

// Tipo de cambio: 7 Bs = 1 USD
export const BS_PER_USD = Number(process.env.EXPO_PUBLIC_BS_PER_USD ?? 7);

// Bonus de creditos para pagos con Stripe (35%)
export const STRIPE_CREDITS_BONUS = Number(process.env.EXPO_PUBLIC_STRIPE_CREDITS_BONUS ?? 0.35);
