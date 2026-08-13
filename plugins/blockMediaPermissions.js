const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

// Permisos que NUNCA deben quedar en el APK final, aunque una librería los
// inyecte por su cuenta (vía su propio AndroidManifest dentro del AAR).
const BLOCK = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  // El SDK nativo de Agora (react-native-agora) inyecta el permiso de
  // compartir pantalla (Media Projection). Nuestra app de videollamadas NO
  // comparte pantalla, y Google Play rechaza este foreground service por
  // "injustificado". OJO: NO bloqueamos FOREGROUND_SERVICE normal porque
  // callkeep/notifee lo usan legítimamente para las notificaciones de llamada.
  'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION',
];

// Servicios de captura de pantalla que Agora aporta desde su AAR y que
// disparan la revisión de "Media Projection". Como no compartimos pantalla,
// los marcamos para que el merge de manifiestos los elimine. Se listan varios
// nombres candidatos: marcar uno que no exista es inofensivo (no-op).
const REMOVE_SERVICES = [
  'io.agora.rtc2.video.AgoraScreenCaptureService',
  'io.agora.rtc.video.AgoraScreenCaptureService',
  'io.agora.rtc.ScreenSharingService',
];

const TOOLS_NS = 'http://schemas.android.com/tools';

module.exports = function withBlockMediaPermissions(config) {
  // withBlockedPermissions agrega <uses-permission ... tools:node="remove"/>
  // para que el merger los quite aunque una librería los vuelva a añadir.
  config = AndroidConfig.Permissions.withBlockedPermissions(config, BLOCK);

  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Aseguramos que xmlns:tools esté declarado en <manifest> para que
    // tools:node="remove" sea interpretado por el merger.
    manifest.$ = manifest.$ || {};
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = TOOLS_NS;
    }

    // Cinturón y tirantes: quitamos declaraciones planas de los permisos
    // bloqueados, PERO conservamos los marcadores tools:node="remove" que
    // agregó withBlockedPermissions (si no, se anularían entre sí).
    for (const tag of ['uses-permission', 'uses-permission-sdk-23']) {
      const perms = manifest[tag] ?? [];
      manifest[tag] = perms.filter((p) => {
        const name = p.$?.['android:name'];
        if (!BLOCK.includes(name)) return true; // no relacionado, se mantiene
        return p.$?.['tools:node'] === 'remove'; // solo mantener el marcador
      });
    }

    // Agregamos <service tools:node="remove"> para que el merger descarte los
    // servicios de screen-capture que aporta el AAR de Agora.
    const app = manifest.application?.[0];
    if (app) {
      app.service = app.service ?? [];
      for (const name of REMOVE_SERVICES) {
        const already = app.service.some((s) => s.$?.['android:name'] === name);
        if (!already) {
          app.service.push({
            $: {
              'android:name': name,
              'tools:node': 'remove',
            },
          });
        }
      }
    }

    return cfg;
  });
};
