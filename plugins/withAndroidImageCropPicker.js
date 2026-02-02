const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidImageCropPicker = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add UCropActivity
    if (!mainApplication.activity.find((a) => a.$['android:name'] === 'com.yalantis.ucrop.UCropActivity')) {
      mainApplication.activity.push({
        $: {
          'android:name': 'com.yalantis.ucrop.UCropActivity',
          'android:screenOrientation': 'portrait',
          'android:theme': '@style/Theme.AppCompat.Light.NoActionBar',
        },
      });
    }

    return config;
  });
};

module.exports = withAndroidImageCropPicker;
