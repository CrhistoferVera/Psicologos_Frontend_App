const { withAndroidManifest } = require('@expo/config-plugins');

const BLOCK = [
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
];

module.exports = function withBlockMediaPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const perms = manifest['uses-permission'] ?? [];
    manifest['uses-permission'] = perms.filter(
      (p) => !BLOCK.includes(p.$['android:name'])
    );
    return config;
  });
};
