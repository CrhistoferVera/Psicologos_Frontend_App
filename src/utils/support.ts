import { Alert, Linking } from 'react-native';

// Número de WhatsApp de soporte (formato internacional, sin "+" ni espacios).
// Cambiar este valor por el número oficial de soporte.
export const SUPPORT_WHATSAPP_NUMBER = '59170000000';

const DEFAULT_SUPPORT_MESSAGE = 'Hola, necesito ayuda con la app de SanaMente.';

/**
 * Abre un chat de WhatsApp con el número de soporte. Si WhatsApp no está
 * disponible, intenta abrir wa.me en el navegador; si todo falla, avisa al usuario.
 */
export async function openSupportWhatsApp(message: string = DEFAULT_SUPPORT_MESSAGE) {
  const text = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${SUPPORT_WHATSAPP_NUMBER}&text=${text}`;
  const webUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${text}`;

  try {
    const canOpenApp = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpenApp ? appUrl : webUrl);
  } catch {
    try {
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert(
        'Soporte',
        `No se pudo abrir WhatsApp. Escríbenos al +${SUPPORT_WHATSAPP_NUMBER}.`,
      );
    }
  }
}
