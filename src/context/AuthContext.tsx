import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { getProfile } from "../services/auth";
import type { User } from "../services/auth";
import { getMyBookings } from "../api/bookings";
import { getProfessionalBookings } from "../api/sessionOfferings";
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
  syncActiveSessionNotification,
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

function isProfessionalRole(role: string | null | undefined) {
  return role === "PROFESSIONAL" || role === "ANFITRIONA";
}

function findActiveBookingFromList(
  rows: Array<{
    id: string;
    status: string;
    paymentStatus: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
  }>,
) {
  const nowMs = Date.now();
  const candidates = rows.filter((item) => {
    if (item.status !== "CONFIRMED") return false;
    if (item.paymentStatus !== "PAID") return false;
    const startMs = new Date(item.scheduledStartAt).getTime();
    const endMs = new Date(item.scheduledEndAt).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false;
    return startMs <= nowMs && nowMs <= endMs;
  });

  if (candidates.length === 0) return null;
  candidates.sort(
    (a, b) =>
      new Date(a.scheduledEndAt).getTime() - new Date(b.scheduledEndAt).getTime(),
  );
  return candidates[0];
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

  useEffect(() => {
    if (!accessToken || !user?.id) {
      void syncActiveSessionNotification(null);
      return;
    }

    let disposed = false;

    const syncActiveSession = async () => {
      try {
        const rows = isProfessionalRole(user.role)
          ? await getProfessionalBookings()
          : await getMyBookings();

        if (disposed) return;

        const active = findActiveBookingFromList(rows);
        if (!active) {
          await syncActiveSessionNotification(null);
          return;
        }

        await syncActiveSessionNotification({
          bookingId: active.id,
          sessionEndsAt: active.scheduledEndAt,
        });
      } catch {
        if (!disposed) {
          await syncActiveSessionNotification(null);
        }
      }
    };

    void syncActiveSession();
    const timer = setInterval(() => {
      void syncActiveSession();
    }, 60_000);

    return () => {
      disposed = true;
      clearInterval(timer);
      void syncActiveSessionNotification(null);
    };
  }, [accessToken, user?.id, user?.role]);

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
