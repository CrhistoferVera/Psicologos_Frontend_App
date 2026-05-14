import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { apiUpdateFcmToken } from '../api/userProfile';
import Toast from 'react-native-toast-message';
import { displayIncomingCall } from './callkeep';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { formatRemainingMinText, getRemainingSessionMs } from '../utils/sessionTime';

// Ref global para saber si la app esta en foreground
// Se actualiza desde AuthContext
export const appActiveRef = { current: true };
// Se actualiza desde pantallas de chat al entrar/salir
export const activeChatRef = { current: null as string | null };

// Ref global para saber si la profesional esta en pantallas de chat
export const professionalChatScreenRef = { current: false };

const DEFAULT_CHANNEL_ID = 'default';
const SESSION_CHANNEL_ID = 'sessions';
const activeSessionNotificationRef = { current: null as string | null };

export const createNotificationChannel = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: DEFAULT_CHANNEL_ID,
      name: 'Notificaciones',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
    await notifee.createChannel({
      id: SESSION_CHANNEL_ID,
      name: 'Sesiones',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  }
};

export const registerForPushNotifications = async (): Promise<void> => {
  try {
    await notifee.requestPermission();

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Permisos de notificacion denegados');
      return;
    }

    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }

    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      await apiUpdateFcmToken(fcmToken);
      console.log('FCM Token registrado:', fcmToken);
    }

    messaging().onTokenRefresh(async (newToken) => {
      await apiUpdateFcmToken(newToken);
    });
  } catch (error) {
    console.error('Error registrando notificaciones:', error);
  }
};

export const setupForegroundNotificationHandler = (): (() => void) => {
  const toastConfig: Record<string, 'success' | 'error' | 'info'> = {
    WITHDRAWAL_APPROVED: 'success',
    WITHDRAWAL_REJECTED: 'error',
    NEW_MESSAGE: 'info',
    NEW_LOCKED_MESSAGE: 'info',
    MESSAGE_UNLOCKED: 'success',
    IMAGE_UNLOCKED: 'success',
    NEW_GALLERY_IMAGE: 'info',
    NEW_WITHDRAWAL_REQUEST: 'info',
    INCOMING_CALL: 'info',
    CALL_ACCEPTED: 'success',
    CALL_REJECTED: 'error',
    CALL_BILLED: 'info',
    CALL_WARNING: 'error',
  };

  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    const type = remoteMessage.data?.type as string;
    const title = remoteMessage.notification?.title ?? 'Notificacion';
    const body = remoteMessage.notification?.body ?? '';

    if (
      (type === 'NEW_MESSAGE' || type === 'NEW_LOCKED_MESSAGE' || type === 'MESSAGE_UNLOCKED') &&
      activeChatRef.current === remoteMessage.data?.conversationId
    ) {
      return;
    }

    if (
      (type === 'INCOMING_CALL' || type === 'CALL_ACCEPTED' || type === 'CALL_REJECTED') &&
      professionalChatScreenRef.current
    ) {
      return;
    }

    if (type === 'INCOMING_CALL') return;
    if (type === 'CALL_WARNING') return;

    Toast.show({
      type: toastConfig[type] ?? 'info',
      text1: title,
      text2: body,
      position: 'top',
      visibilityTime: 4000,
      topOffset: 60,
    });

    if (!appActiveRef.current) {
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: DEFAULT_CHANNEL_ID,
          sound: 'default',
          importance: AndroidImportance.HIGH,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
        },
      });
    }
  });

  return unsubscribe;
};

export const setupBackgroundNotificationHandler = (): void => {
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App abierta desde notificacion (quit):', remoteMessage.data);
      }
    });

  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('App abierta desde notificacion (background):', remoteMessage.data);
  });
};

export const setBackgroundMessageHandler = (): void => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Notificacion recibida en background:', remoteMessage);

    const type = remoteMessage.data?.type as string;
    if (type === 'INCOMING_CALL') {
      const callId = remoteMessage.data?.callId as string;
      const callerName = (remoteMessage.data?.callerName as string) ?? 'Cliente';
      const isVideo = remoteMessage.data?.callType === 'VIDEO_CALL';
      displayIncomingCall(callId, callerName, isVideo);
    }
  });
};

function sessionNotificationIdForBooking(bookingId: string) {
  return `active-session-${bookingId}`;
}

export async function syncActiveSessionNotification(input: {
  bookingId: string;
  sessionEndsAt: string;
} | null): Promise<void> {
  if (Platform.OS !== 'android') return;

  if (!input?.bookingId || !input.sessionEndsAt) {
    if (activeSessionNotificationRef.current) {
      await notifee.cancelNotification(activeSessionNotificationRef.current);
      activeSessionNotificationRef.current = null;
    }
    return;
  }

  const remainingMs = getRemainingSessionMs(input.sessionEndsAt);
  if (remainingMs <= 0) {
    if (activeSessionNotificationRef.current) {
      await notifee.cancelNotification(activeSessionNotificationRef.current);
      activeSessionNotificationRef.current = null;
    }
    return;
  }

  const notificationId = sessionNotificationIdForBooking(input.bookingId);
  if (activeSessionNotificationRef.current && activeSessionNotificationRef.current !== notificationId) {
    await notifee.cancelNotification(activeSessionNotificationRef.current);
  }

  activeSessionNotificationRef.current = notificationId;
  await notifee.displayNotification({
    id: notificationId,
    title: 'Sesion activa',
    body: `Tu sesion termina en ${formatRemainingMinText(remainingMs)}.`,
    android: {
      channelId: SESSION_CHANNEL_ID,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
      ongoing: true,
      autoCancel: false,
      importance: AndroidImportance.HIGH,
      onlyAlertOnce: true,
    },
  });
}