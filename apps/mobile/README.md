# Investio Mobile

Expo SDK 54 React Native app for iOS and Android.

## Lokální development

### Předpoklady

- Node.js 20+
- pnpm 9+
- Expo Go nainstalované na telefonu (nebo iOS Simulator / Android Emulator)

### Instalace závislostí

Z kořene monorepa:

```bash
pnpm install
```

### Spuštění Metro bundleru

```bash
pnpm --filter @investio/mobile start
```

Nebo přímo z `apps/mobile/`:

```bash
pnpm start
```

Metro nastartuje a zobrazí QR kód — naskenuj ho v Expo Go na telefonu,
nebo stiskni `i` (iOS Simulator) / `a` (Android Emulator).

### Typecheck

```bash
pnpm --filter @investio/mobile typecheck
```

### i18n parita check

```bash
pnpm --filter @investio/i18n check-parity
```

---

## EAS preview build

EAS (Expo Application Services) builduje nativní binárky v cloudu.
Preview profile distribuuje `.ipa` / `.apk` přímo na zařízení bez App Store.

### Předpoklady pro EAS

1. **EAS CLI**: `npm install -g eas-cli` (nebo `pnpm add -g eas-cli`)
2. **Expo account**: registrace zdarma na [expo.dev](https://expo.dev)
3. **Přihlášení**: `eas login`
4. **EAS free tier** — 30 build minut/měsíc. Pro iteraci použi lokální build
   (`eas build --local`), cloud build si schovej pro preview.

### Spuštění preview buildu

```bash
# iOS (distribuce přes TestFlight Internal / .ipa)
eas build --profile preview --platform ios

# Android (distribuce jako .apk — nevyžaduje Play Console)
eas build --profile preview --platform android

# Obě platformy najednou
eas build --profile preview --platform all
```

Po dokončení buildu EAS vygeneruje QR kód a download link.
**iOS**: vyžaduje Apple Developer Account (free tier nestačí pro device install mimo TestFlight).
**Android**: .apk lze nainstalovat přímo.

### OTA update (JS-only změny)

Pokud jsi nezměnil nativní konfiguraci (app.json, nový native module):

```bash
eas update --branch preview --message "popis změny"
```

OTA update se projeví při příštím spuštění aplikace bez nového buildu.

**Pozor**: OTA update nefunguje na native module změny — ty vždy vyžadují
nový `eas build`.

### Development build (s hot reload na reálném zařízení)

```bash
eas build --profile development --platform ios
```

Development build nainstaluje `expo-dev-client`, který umožňuje hot reload
a DevTools na reálném zařízení (Expo Go nedovolí custom native modules).

---

## Profily v eas.json

| Profil | Účel | Distribuce |
|--------|------|------------|
| `development` | Lokální dev s hot reload, DevTools | internal |
| `preview` | Sdílení s testers, PR review | internal |
| `production` | App Store / Play Store | store (vyžaduje lidský krok) |

---

## Screens

| Route | Popis |
|-------|-------|
| `/(tabs)/` | Dashboard placeholder (T-005 scaffold) |
| `/(auth)/login` | Login UI stub — email + password form |
| `/(auth)/signup` | Signup UI stub — email + password + confirm form |
| `/parity-check` | DEV screen — proof-of-concept shared package imports |

## Poznámky k architektuře

- Sdílené packages (`@investio/shared`, `@investio/i18n`, `@investio/design-tokens`) importuje Metro přímo jako TypeScript source — transpiluje on-the-fly.
- Auth tokeny se ukládají do `expo-secure-store` (Keychain na iOS, EncryptedSharedPreferences na Android) — nikdy do AsyncStorage.
- `apps/mobile/lib/i18n.ts` inicializuje i18next — musí být importován na vrcholu `app/_layout.tsx`.
