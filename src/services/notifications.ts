import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { apiUpdateFcmToken } from '../api/userProfile';
import Toast from 'react-native-toast-message';
import { displayIncomingCall } from './callkeep';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { formatRemainingMinText, getRemainingSessionMs } from '../utils/sessionTime';

// Ref global para saber si la app está en foreground
// Se actualiza desde AuthContext
export const appActiveRef = { current: true };
// Se actualiza desde ChatScreen al entrar/salir
export const activeChatRef = { current: null as string | null };

// Ref global para saber en qué pantalla está la profesional
// Se actualiza desde chats.tsx y chat/[conversationId].tsx
export const professionalChatScreenRef = { current: false };

const DEFAULT_CHANNEL_ID = 'default';
const SESSION_CHANNEL_ID = 'sessions';
const activeSessionNotificationRef = { current: null as string | null };

// CREAR CANAL DE NOTIFICACIONES
// Debe llamarse una vez al iniciar la app para que el sonido funcione en foreground
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

// SOLICITAR PERMISOS Y REGISTRAR TOKEN
// Pide permiso al usuario, obtiene el FCM token y lo guarda en el backend
export const registerForPushNotifications = async (): Promise<void> => {
    try {
        // Pedir permisos de notifee (Android 13+)
        await notifee.requestPermission();

        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
            console.log('Permisos de notificación denegados');
            return;
        }

        // En Android el registro es automático, en iOS necesita esto
        if (Platform.OS === 'ios') {
            await messaging().registerDeviceForRemoteMessages();
        }

        const fcmToken = await messaging().getToken();
        if (fcmToken) {
            await apiUpdateFcmToken(fcmToken);
            console.log('FCM Token registrado:', fcmToken);
        }

        // Si el token se refresca, actualizarlo en el backend
        messaging().onTokenRefresh(async (newToken) => {
            await apiUpdateFcmToken(newToken);
        });

    } catch (error) {
        console.error('Error registrando notificaciones:', error);
    }
};

// MANEJAR NOTIFICACIONES EN FOREGROUND
// Se activa cuando la app está ABIERTA y llega una notificación
// Firebase no muestra nada automáticamente en foreground, así que lo hacemos nosotros con Toast
export const setupForegroundNotificationHandler = (): (() => void) => {

    // Mapa de tipos: define qué color de Toast mostrar según el tipo de notificación
    // El backend envía el 'type' dentro del campo data del mensaje
    // 'success' = verde, 'error' = rojo, 'info' = azul
    const toastConfig: Record<string, 'success' | 'error' | 'info'> = {
        WITHDRAWAL_APPROVED: 'success',
        WITHDRAWAL_REJECTED: 'error',
        NEW_MESSAGE:         'info',// mensaje nuevo normal
        NEW_LOCKED_MESSAGE:   'info', //mensage bloqueado, se muestra como info aunque es un mensaje nuevo
        MESSAGE_UNLOCKED:     'success',// mensaje desbloqueado
        IMAGE_UNLOCKED:       'success',// imagen desbloqueada
        NEW_GALLERY_IMAGE:    'info',   // nueva imagen publicada por profesional
        NEW_WITHDRAWAL_REQUEST: 'info', // nueva solicitud de retiro (para admins), se muestra como success aunque es un mensaje nuevo
        INCOMING_CALL:       'info',
        CALL_ACCEPTED:       'success', // llamada aceptada
        CALL_REJECTED:       'error',   // llamada rechazada
        CALL_BILLED:         'info',    // llamada facturada
        CALL_WARNING:      'error',   // advertencia de llamada (ej: saldo bajo)
    };

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        const type = remoteMessage.data?.type as string;
        const title = remoteMessage.notification?.title ?? 'Notificación';
        const body = remoteMessage.notification?.body ?? '';

        // Si es mensaje nuevo (normal o bloqueado o desbloqueado) y el usuario está viendo esa conversación, no mostrar Toast
        if (
            (type === 'NEW_MESSAGE' || type === 'NEW_LOCKED_MESSAGE' || type === 'MESSAGE_UNLOCKED') &&
            activeChatRef.current === remoteMessage.data?.conversationId
        ) return;

        // Si la profesional está en chats o dentro de un chat, ignorar notificaciones de llamada
        if (
            (type === 'INCOMING_CALL' || type === 'CALL_ACCEPTED' || type === 'CALL_REJECTED') &&
            professionalChatScreenRef.current
        ) return;

        // INCOMING_CALL nunca se muestra en foreground: el UI de llamada entrante ya aparece en la app
        if (type === 'INCOMING_CALL') return;

        // CALL_WARNING solo se muestra en background: durante la llamada la UI ya está visible
        if (type === 'CALL_WARNING') return;

        console.log('Toast type:', type, 'title:', title);

        Toast.show({
            type: toastConfig[type] ?? 'info',
            text1: title,
            text2: body,
            position: 'top',
            visibilityTime: 4000,
            topOffset: 60,
        });

        // Solo mostrar notificación del sistema si la app está en background
        if (!appActiveRef.current) {
            const channelId = DEFAULT_CHANNEL_ID;
            await notifee.displayNotification({
                title,
                body,
                android: {
                    channelId,
                    sound: 'default',
                    importance: AndroidImportance.HIGH,
                    smallIcon: 'ic_launcher',
                    pressAction: { id: 'default' },
                },
            });
        }
    });

    // Retorna función para cancelar el listener (se llama en el useEffect cleanup)
    return unsubscribe;
};

// MANEJAR NOTIFICACIONES EN BACKGROUND/QUIT
// Se activa cuando el usuario toca la notificación para abrir la app
export const setupBackgroundNotificationHandler = (): void => {
    // Cuando la app está CERRADA y el usuario toca la notificación
    messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
            if (remoteMessage) {
                console.log('App abierta desde notificación (quit):', remoteMessage.data);
            }
        });

    // Cuando la app está en BACKGROUND y el usuario toca la notificación
    messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('App abierta desde notificación (background):', remoteMessage.data);
    });
};

// HANDLER DE BACKGROUND
// Procesa mensajes cuando la app está cerrada: debe registrarse en index.js antes de que la app cargue
export const setBackgroundMessageHandler = (): void => {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('Notificación recibida en background:', remoteMessage);

        const type = remoteMessage.data?.type as string;

        // Si es llamada entrante, mostrar pantalla nativa de llamada con sonido
        if (type === 'INCOMING_CALL') {
            const callId    = remoteMessage.data?.callId as string;
            const callerName = remoteMessage.data?.callerName as string ?? 'Cliente';
            const isVideo   = remoteMessage.data?.callType === 'VIDEO_CALL';

            // Muestra la pantalla nativa del sistema (como WhatsApp)
            // con botones de Aceptar/Rechazar y sonido de ringtone
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
    if (
        activeSessionNotificationRef.current &&
        activeSessionNotificationRef.current !== notificationId
    ) {
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

