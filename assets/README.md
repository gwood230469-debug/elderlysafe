# Assets needed before building

`app.config.js` references these files, which don't exist yet — add them
before running `expo prebuild` or `eas build`, or the build will fail
looking for missing icon files:

- `icon.png` — 1024×1024, used as the app icon source
- `android-icon-foreground.png`, `android-icon-background.png`,
  `android-icon-monochrome.png` — Android adaptive icon layers (see
  [Expo's adaptive icon docs](https://docs.expo.dev/develop/user-interface/app-icons/))

Suggested style, matching the Classical design system: a simple mark on
`#f3f2f2` (bg) or `#eae9e9` (surface), drawn in `#b68235` (accent) —
avoid photographic or gradient treatments.
