const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

const BLOCK = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
];

module.exports = function withBlockMediaPermissions(config) {
  // withBlockedPermissions marks them as "remove" so the merge tool strips them
  // even if a library tries to add them back via its own manifest.
  config = AndroidConfig.Permissions.withBlockedPermissions(config, BLOCK);

  // Belt-and-suspenders: also strip them from the final merged manifest in case
  // they slipped through before this plugin runs.
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    for (const tag of ['uses-permission', 'uses-permission-sdk-23']) {
      const perms = manifest[tag] ?? [];
      manifest[tag] = perms.filter(
        (p) => !BLOCK.includes(p.$?.['android:name'])
      );
    }
    return cfg;
  });
};
