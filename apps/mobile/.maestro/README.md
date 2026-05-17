# Mobile E2E Tests — Maestro

## What is Maestro?

[Maestro](https://maestro.mobile.dev/) is a mobile UI testing framework that
drives iOS simulators and Android emulators using YAML flow files. Unlike
WebDriver-based tools it is designed specifically for native mobile apps.

## Setup — macOS

1. Install Maestro CLI:

   ```sh
   brew install --cask maestro
   ```

   Verify installation:

   ```sh
   maestro --version
   ```

2. Ensure an iOS simulator or Android emulator is running with the **EAS dev
   build** of Investio installed.

   > Expo Go is NOT supported. The app uses `@shopify/react-native-skia` (via
   > Victory Native XL) which requires a native module compiled for the target
   > platform. See T-015 hand-back notes and `apps/mobile/eas.json` for build
   > profiles.

## Running the flows

Run all flows in sequence:

```sh
cd apps/mobile
maestro test .maestro/
```

Run a single flow:

```sh
maestro test .maestro/01-launch.yaml
maestro test .maestro/02-calc-compound.yaml
maestro test .maestro/03-dashboard.yaml
```

### With a specific device

```sh
# iOS — pass the simulator UDID (from `xcrun simctl list devices`)
maestro --device <UDID> test .maestro/

# Android — pass the device ID (from `adb devices`)
maestro --device <DEVICE_ID> test .maestro/
```

## Flow descriptions

| File | What it tests |
|---|---|
| `01-launch.yaml` | App launches; compound tab label visible in tab bar |
| `02-calc-compound.yaml` | Navigate to compound tab; enter initial amount; result hero visible |
| `03-dashboard.yaml` | Navigate to dashboard tab; graceful empty-state banner when backend not configured |

## CI integration

CI integration is deferred to T-022 (DevOps). Maestro requires a device farm
(e.g. [Maestro Cloud](https://maestro.mobile.dev/cloud) or
[BrowserStack App Automate](https://www.browserstack.com/app-automate)) for
headless CI runs. This is out of scope for the current milestone.

## Troubleshooting

**`assertVisible` fails for text that should be on screen**

- Verify the translation key resolves to the expected string. See
  `packages/i18n/locales/cs.json` — flows use CS locale strings.
- If the app was rebuilt with a different `appId`, update the `appId:` field
  in each YAML file. Check `apps/mobile/app.json` for the current bundle ID.

**`tapOn` misses the target**

- Ensure the simulator screen is not obscured by a keyboard or system dialog.
- Try adding `- tapOn: text: "<exact label text>"` and confirm the text is
  exactly what is rendered (use Maestro Studio: `maestro studio` for visual
  inspection).

**Skia / Victory Native XL crash on launch**

- You are likely running in Expo Go. Build an EAS dev build:
  ```sh
  eas build --platform ios --profile development
  ```
  Then install the resulting `.ipa` on your simulator.
