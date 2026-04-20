import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import { getProfile } from "../services/auth";
import type { User } from "../services/auth";
import {
  getAccessToken,
  getUser,
  removeAccessToken,
  removeUser,
  removeTempToken,
  setAccessToken,
  setUser,
} from "../storage/authStorage";

//importamos funciones para manejar notificaciones push
import { registerForPushNotifications, setupForegroundNotificationHandler, setupBackgroundNotificationHandler, createNotificationChannel, appActiveRef } from "../services/notifications";

type AuthContextValue = {
  accessToken: string | null;
  user: User | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const hydrate = useCallback(async () => {
    const [storedToken, storedUser] = await Promise.all([
      getAccessToken(),
      getUser(),
    ]);

    if (!storedToken) {
      setAccessTokenState(null);
      setUserState(storedUser ?? null);
      setIsHydrated(true);
      return;
    }

    if (storedUser) {
      setAccessTokenState(storedToken);
      setUserState(storedUser);
      setIsHydrated(true);
      return;
    }

    try {
      const profile = await getProfile();
      await setUser(profile);
      setAccessTokenState(storedToken);
      setUserState(profile);
    } catch {
      await Promise.all([removeAccessToken(), removeUser(), removeTempToken()]);
      setAccessTokenState(null);
      setUserState(null);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const setSession = useCallback(async (token: string, nextUser: User) => {
    await Promise.all([setAccessToken(token), setUser(nextUser)]);
    setAccessTokenState(token);
    setUserState(nextUser);
    // Registrar FCM token después del login
    //para registrar el token de FCM en el backend cada vez que el usuario inicia sesión,
    //lo que asegura que el backend tenga el token actualizado para enviar notificaciones push al dispositivo del usuario
    void registerForPushNotifications();
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([removeAccessToken(), removeUser(), removeTempToken()]);
    setAccessTokenState(null);
    setUserState(null);
  }, []);

  //sirve para cargar el perfil del usuario al iniciar la app,
  //y también para registrar el token de FCM y configurar los handlers de notificaciones push
  useEffect(() => {
    void hydrate();
    void createNotificationChannel();
    setupBackgroundNotificationHandler();
    const unsubscribeForeground = setupForegroundNotificationHandler();
    // Actualizar appActiveRef cuando la app cambia de estado
    const sub = AppState.addEventListener('change', (state) => {
      appActiveRef.current = state === 'active';
    });
    return () => { unsubscribeForeground(); sub.remove(); };
  }, [hydrate]);

  const value = useMemo(
    () => ({ accessToken, user, isHydrated, hydrate, setSession, logout }),
    [accessToken, user, isHydrated, hydrate, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}

/*
Ejemplos de uso (resumen):

1) Esperar hidratacion y redirigir segun rol:

  const { user, isHydrated } = useAuth();
  useEffect(() => {
    if (!isHydrated || !user) return;
    if (user.role === "ADMIN") router.replace("/admin");
    if (user.role === "ANFITRIONA" || user.role === "PROFESSIONAL") router.replace("/(professional)/dashboard");
    if (user.role === "USER") router.replace("/(user)/home");
  }, [isHydrated, user]);

2) Leer datos del usuario (id, rol, etc) una vez hidratado:

  const { user, isHydrated } = useAuth();
  if (isHydrated && user) {
    console.log(user.id, user.role, user.email);
  }
*/

