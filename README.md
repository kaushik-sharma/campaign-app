# Campaigns

A mobile app for community-funded message amplification. Creators publish a campaign (a message, the sources behind it, and the ads that will carry it); after review, backers pool contributions that pay for those ads to reach people outside the creator's own network. Every campaign ends with a public report of what was raised, spent and reached.

This is a prototype. Sign-in is real (Firebase email and password); campaigns, payments, review and ad delivery are simulated on the device, and no real money moves.

## Stack

Expo SDK 57 · React Native 0.86 (New Architecture) · Expo Router · Reanimated 4 and Gesture Handler · TanStack Query · Zustand · react-hook-form and zod · React Native Firebase (Auth) · TypeScript (strict).

## Run it

The app uses native code (Firebase), so it runs as a development build rather than in Expo Go.

```bash
npm install
npm run ios       # builds and installs on the iOS simulator
npm run android   # builds and installs on an Android emulator or device
```

After changing native configuration (`app.json`, plugins, icons, splash), regenerate the native projects first:

```bash
npx expo prebuild --clean
```

`npm run ios:go` / `npm run android:go` still open the app in Expo Go. Firebase isn't available there, so sign-in falls back to accounts stored on the device. Set `EXPO_PUBLIC_AUTH=mock` to use that fallback in a development build too.

### Firebase

- Config files: `GoogleService-Info.plist` (iOS) and `google-services.json` (Android), for the bundle id / package `com.anonymous.campaignapp`.
- In the Firebase console, enable **Authentication → Sign-in method → Email/Password**.
- Sample creator account: `demo@campaigns.app` / `demo1234`. Create it in the console or with "Create account" in the app. It owns five seeded campaigns at different stages, for exploring the creator dashboard, campaign management and reports.

## Checks

```bash
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

## Project layout

```
src/
  app/          Routes (Expo Router). Every file is a screen.
  components/   UI, grouped by feature; shared primitives in components/ui
  features/     Data hooks (TanStack Query) that screens use
  services/     Typed service contracts, Firebase auth and the on-device sample backend
  domain/       Business rules: fees, reach estimates, lifecycle, reports
  content/      Static copy (info pages, voice prompts)
  config/       Every simulation assumption in one place
  lib/          Formatting, storage, haptics, reduced motion
  stores/       Small client state (Zustand): preferences, toasts, hero transition
  theme/        Design tokens and theming
docs/PLAN.md    Build plan, decisions and phase status
```

Screens never import the sample backend directly (enforced by ESLint); they go through `src/features` hooks and the `@/services` facade, so a real backend can replace each service without UI changes.

## Icon

The app icon, Android adaptive icon layers and splash images are generated from one vector drawing of the Campaigns mark: a dot with two ripples, open on the right like a "C". To regenerate them after changing the drawing:

```bash
npm run icons
```

The same geometry is drawn in the app by `LogoMark` (`src/components/ui/logo.tsx`).
