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
        projectId: '34f65058-54cd-454f-9f06-087f217ba0ba',
      },
    },
    plugins: [
      ['expo-notifications', { color: '#b68235' }],
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'SafeWord uses your location to show the right emergency numbers for where you are.',
        },
      ],
      '@react-native-google-signin/google-signin',
      // modules/call-screening is a local Expo module (autolinked from
      // ./modules by default) — its native <service>/permission entries are
      // declared in the module's own AndroidManifest.xml and merged in by
      // the Android build automatically, so it needs no plugin entry here.
      // It does, however, require API 29+ (RoleManager.ROLE_CALL_SCREENING),
      // so the app's own minSdkVersion must be raised to match — Expo's
      // managed default of 24 is otherwise incompatible with that module and
      // fails the Android manifest merge.
      [
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 29,
          },
        },
      ],
    ],
  },
};
