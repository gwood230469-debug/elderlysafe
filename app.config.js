// app.config.js instead of app.json: the Google Sign-In config plugin needs
// an Android/iOS URL scheme built from env vars, which static JSON can't
// reference. This is an Android-only app — no ios block, no Apple auth.
module.exports = {
  expo: {
    name: 'SafeWord',
    slug: 'elderlysafe',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    backgroundColor: '#f3f2f2',
    scheme: 'safeword',
    android: {
      package: 'com.gwood230469debug.elderlysafe',
      adaptiveIcon: {
        backgroundColor: '#f3f2f2',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    extra: {
      eas: {
        // Run `eas init` once this project is linked to an EAS account —
        // this placeholder must be replaced before `eas build`/push
        // notifications will work.
        projectId: 'REPLACE_WITH_EAS_PROJECT_ID',
      },
    },
    plugins: [
      ['expo-notifications', { color: '#b68235' }],
      '@react-native-google-signin/google-signin',
      // modules/call-screening is a local Expo module (autolinked from
      // ./modules by default) — its native <service>/permission entries are
      // declared in the module's own AndroidManifest.xml and merged in by
      // the Android build automatically, so it needs no plugin entry here.
    ],
  },
};
