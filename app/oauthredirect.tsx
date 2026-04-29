import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import { useAuth } from "../src/context/AuthContext";
import { loginWithGoogle } from "../src/services/auth";

// Keys used to pass PKCE session data from AuthScreen to this route.
export const GOOGLE_AUTH_STORAGE_KEY = "__google_auth";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export default function OAuthRedirectScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
  }>();
  const router = useRouter();
  const { setSession } = useAuth();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;

    async function completeAuth() {
      setDone(true);

      const { code, error } = params;

      if (error) {
        console.log("[OAuthRedirect] Google returned error:", error);
        Alert.alert("Google Login falló", `Google devolvió error: ${error}`);
        router.replace("/(public)" as any);
        return;
      }

      if (!code) {
        console.log("[OAuthRedirect] No code in params, redirecting to login");
        router.replace("/(public)" as any);
        return;
      }

      console.log("[OAuthRedirect] code received, completing exchange...");

      try {
        const raw = await AsyncStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
        const session = raw ? JSON.parse(raw) : null;

        if (!session?.clientId || !session?.redirectUri) {
          throw new Error("No se encontró la sesión de autenticación. Intenta de nuevo.");
        }

        console.log("[OAuthRedirect] has codeVerifier:", Boolean(session.codeVerifier));

        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: session.clientId,
            redirectUri: session.redirectUri,
            code,
            extraParams: session.codeVerifier
              ? { code_verifier: session.codeVerifier }
              : undefined,
          },
          { tokenEndpoint: GOOGLE_TOKEN_ENDPOINT },
        );

        const idToken = tokenResponse.idToken;
        console.log("[OAuthRedirect] token exchange done, has idToken:", Boolean(idToken));

        if (!idToken) {
          throw new Error(
            "Google no devolvió id_token tras el intercambio. " +
            "Verifica que el Client ID y redirect URI estén configurados correctamente.",
          );
        }

        const response = await loginWithGoogle(idToken);
        await setSession(response.access_token, response.user);

        const role = response.user.role;
        if (role === "ADMIN") {
          router.replace("/admin");
        } else if (role === "ANFITRIONA" || role === "PROFESSIONAL") {
          router.replace("/(professional)/dashboard");
        } else {
          router.replace("/(user)/home");
        }
      } catch (err: any) {
        console.log("[OAuthRedirect] error:", err?.message ?? err);
        Alert.alert("Google Login falló", err?.message ?? "No se pudo completar el login con Google.");
        router.replace("/(public)" as any);
      } finally {
        await AsyncStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
      }
    }

    completeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
