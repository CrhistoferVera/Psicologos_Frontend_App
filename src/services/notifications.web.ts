export const appActiveRef = { current: true };
export const activeChatRef = { current: null as string | null };
export const anfitrionaChatScreenRef = { current: false };

export const createNotificationChannel = async (): Promise<void> => {
  // Web: not supported
};

export const registerForPushNotifications = async (): Promise<void> => {
  // Web: not supported
};

export const setupForegroundNotificationHandler = (): (() => void) => {
  // Web: not supported
  return () => {};
};

export const setupBackgroundNotificationHandler = (): void => {
  // Web: not supported
};

export const setBackgroundMessageHandler = (): void => {
  // Web: not supported
};
