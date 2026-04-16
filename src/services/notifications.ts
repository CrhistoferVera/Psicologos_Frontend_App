import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { apiUpdateFcmToken } from '../api/userProfile';
import Toast from 'react-native-toast-message';
import { displayIncomingCall } from './callkeep';
import notifee, { AndroidImportance } from '@notifee/react-native';

// Ref global para saber si la app estÃ¡ en foreground
// Se actualiza desde AuthContext
export const appActiveRef = { current: true };
// Se actualiza desde ChatScreen al entrar/salir
export const activeChatRef = { current: null as string | null };

// Ref global para saber en quÃ© pantalla estÃ¡ la profesional
// Se actualiza desde chats.tsx y chat/[conversationId].tsx
export const professionalChatScreenRef = { current: false };

// CREAR CANAL DE NOTIFICACIONES
// Debe llamarse una vez al iniciar la app para que el sonido funcione en foreground
export const createNotificationChannel = async (): Promise<void> => {
    if (Platform.OS === 'android') {
        await notifee.createChannel({
            id: 'default',
            name: 'Notificaciones',
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
            console.log('Permisos de notificaciÃ³n denegados');
            return;
        }

        // En Android el registro es automÃ¡tico, en iOS necesita esto
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
// Se activa cuando la app estÃ¡ ABIERTA y llega una notificaciÃ³n
// Firebase no muestra nada automÃ¡ticamente en foreground, asÃ­ que lo hacemos nosotros con Toast
export const setupForegroundNotificationHandler = (): (() => void) => {

    // Mapa de tipos â€” define quÃ© color de Toast mostrar segÃºn el tipo de notificaciÃ³n
    // El backend envÃ­a el 'type' dentro del campo data del mensaje
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
        const title = remoteMessage.notification?.title ?? 'NotificaciÃ³n';
        const body = remoteMessage.notification?.body ?? '';

        // Si es mensaje nuevo (normal o bloqueado o desbloqueado) y el usuario estÃ¡ viendo esa conversaciÃ³n, no mostrar Toast
        if (
            (type === 'NEW_MESSAGE' || type === 'NEW_LOCKED_MESSAGE' || type === 'MESSAGE_UNLOCKED') &&
            activeChatRef.current === remoteMessage.data?.conversationId
        ) return;

        // Si la profesional estÃ¡ en chats o dentro de un chat, ignorar notificaciones de llamada
        if (
            (type === 'INCOMING_CALL' || type === 'CALL_ACCEPTED' || type === 'CALL_REJECTED') &&
            professionalChatScreenRef.current
        ) return;

        // INCOMING_CALL nunca se muestra en foreground â€” el UI de llamada entrante ya aparece en la app
        if (type === 'INCOMING_CALL') return;

        // CALL_WARNING solo se muestra en background â€” durante la llamada la UI ya estÃ¡ visible
        if (type === 'CALL_WARNING') return;

        console.log('ðŸ”” Toast type:', type, 'title:', title);

        Toast.show({
            type: toastConfig[type] ?? 'info',
            text1: title,
            text2: body,
            position: 'top',
            visibilityTime: 4000,
            topOffset: 60,
        });

        // Solo mostrar notificaciÃ³n del sistema si la app estÃ¡ en background
        if (!appActiveRef.current) {
            const channelId = 'default';
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

    // Retorna funciÃ³n para cancelar el listener (se llama en el useEffect cleanup)
    return unsubscribe;
};

// MANEJAR NOTIFICACIONES EN BACKGROUND/QUIT
// Se activa cuando el usuario toca la notificaciÃ³n para abrir la app
export const setupBackgroundNotificationHandler = (): void => {
    // Cuando la app estÃ¡ CERRADA y el usuario toca la notificaciÃ³n
    messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
            if (remoteMessage) {
                console.log('App abierta desde notificaciÃ³n (quit):', remoteMessage.data);
            }
        });

    // Cuando la app estÃ¡ en BACKGROUND y el usuario toca la notificaciÃ³n
    messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('App abierta desde notificaciÃ³n (background):', remoteMessage.data);
    });
};

// HANDLER DE BACKGROUND
// Procesa mensajes cuando la app estÃ¡ cerrada â€” debe registrarse en index.js antes de que la app cargue
export const setBackgroundMessageHandler = (): void => {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('NotificaciÃ³n recibida en background:', remoteMessage);

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

