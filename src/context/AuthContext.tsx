import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AppState, Platform } from "react-native";
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

import {
  registerForPushNotifications,
  setupForegroundNotificationHandler,
  setupBackgroundNotificationHandler,
  createNotificationChannel,
  appActiveRef,
} from "../services/notifications";

type AuthContextValue = {
  accessToken: string | null;
  user: User | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isBlockedAdminOnMobile(user: User | null) {
  return Platform.OS !== "web" && user?.role === "ADMIN";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const clearSessionState = useCallback(async () => {
    await Promise.all([removeAccessToken(), removeUser(), removeTempToken()]);
    setAccessTokenState(null);
    setUserState(null);
  }, []);

  const hydrate = useCallback(async () => {
    const [storedToken, storedUser] = await Promise.all([getAccessToken(), getUser()]);

    if (!storedToken) {
      if (isBlockedAdminOnMobile(storedUser)) {
        await clearSessionState();
      } else {
        setAccessTokenState(null);
        setUserState(storedUser ?? null);
      }
      setIsHydrated(true);
      return;
    }

    if (storedUser) {
      if (isBlockedAdminOnMobile(storedUser)) {
        await clearSessionState();
      } else {
        setAccessTokenState(storedToken);
        setUserState(storedUser);
      }
      setIsHydrated(true);
      void getProfile().then(async (fresh) => {
        if (!isBlockedAdminOnMobile(fresh)) {
          await setUser(fresh);
          setUserState(fresh);
        }
      }).catch(() => {});
      return;
    }

    try {
      const profile = await getProfile();
      if (isBlockedAdminOnMobile(profile)) {
        await clearSessionState();
      } else {
        await setUser(profile);
        setAccessTokenState(storedToken);
        setUserState(profile);
      }
    } catch {
      await clearSessionState();
    } finally {
      setIsHydrated(true);
    }
  }, [clearSessionState]);

  const setSession = useCallback(
    async (token: string, nextUser: User) => {
      if (isBlockedAdminOnMobile(nextUser)) {
        await clearSessionState();
        return;
      }

      await Promise.all([setAccessToken(token), setUser(nextUser)]);
      setAccessTokenState(token);
      setUserState(nextUser);
      void registerForPushNotifications();
    },
    [clearSessionState],
  );

  const logout = useCallback(async () => {
    await clearSessionState();
  }, [clearSessionState]);

  useEffect(() => {
    void hydrate();
    void createNotificationChannel();
    setupBackgroundNotificationHandler();
    const unsubscribeForeground = setupForegroundNotificationHandler();
    const sub = AppState.addEventListener("change", (state) => {
      appActiveRef.current = state === "active";
    });
    return () => {
      unsubscribeForeground();
      sub.remove();
    };
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
