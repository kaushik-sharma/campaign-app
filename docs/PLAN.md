# Build plan — Campaigns (Campaign Amplification Platform)

Source of truth for product rules: the hackathon PRD. This file records the approved build plan and decisions.

## Stack

Expo SDK 57 · RN 0.86 (New Architecture) · Expo Router (custom JS tab bar via `expo-router/js-tabs`) · Reanimated 4 + Gesture Handler · Zustand · TanStack Query · react-hook-form + zod · expo-haptics · expo-image · expo-image-picker · custom floating bottom sheet (one implementation, both platforms) · FlashList · Phosphor icons · Inter + Source Serif 4.

Phases 1–5 ran in **Expo Go**; from Phase 6 the app runs as a development build (`npm run ios` / `npm run android`) because Firebase needs native code. In Expo Go it still runs, with on-device mock auth. Not in Expo Go → worked around:

| Want | Workaround |
|---|---|
| Shared-element card → detail | Custom hero transition (measure card cover → animate into detail header) |
| Real speech-to-text | Labelled demo mode + "type instead" |
| Remote push | In-app notification center only |

## Decisions

1. Name **Campaigns**, indigo accent.
2. Flexible funding: below goal still distributes; under a $250 minimum, everyone is refunded.
3. Fees: 10% platform fee from the pool; processing (2.9% + $0.30) added at checkout.
4. Custom JS tab bar.
5. ~25 Unsplash images bundled locally.
6. Real auth (final phase): Firebase (React Native Firebase), email + password. Everything else stays sample data on the device, owned by the Firebase user.
7. EAS / APK build: staged — discuss before running.
8. Primary test device: iOS (development build).
9. Commit at the end of each phase.

## Architecture rules

- `src/app/` holds routes only. Screens use `src/features/*` hooks, never `src/services/mock` (ESLint-enforced).
- Every data call goes through typed contracts in `src/services/contracts.ts`; `src/services/index.ts` picks the implementation: Firebase auth in development builds, on-device mock auth in Expo Go or with `EXPO_PUBLIC_AUTH=mock`.
- The mock behaves like a network: latency, configurable failure rate, cursor pagination, input validation, permission checks.
- All demo assumptions live in `src/config/demo.ts`.
- Money is integer cents. One `estimateReach()` and one `computeFees()` (in `src/domain/`) are used everywhere.
- Estimates are always shown with ≈ / "Est." and link to the assumptions.
- AI output types (`DraftPatch`) cannot contain the funding goal.

## Phases

| # | Phase | Est. | Status |
|---|---|---|---|
| 1 | Foundation: design system, motion primitives, tab shell, mock services, dev panel | 5h | done |
| 2 | Home, Explore, Campaign Detail (+ hero transition, imagery, stories) | 8h | done |
| 3 | Back a Campaign (amount → review → simulated checkout → result), receipts, follow/save | 4h | done |
| 4 | 5-step creation (Basics → Story → Campaign & Ad Visuals → Reach → Submit), voice/AI demo, autosave, lifecycle simulator | 8.5h | done |
| 5 | Activity, Profile, Creator Dashboard, Reports, info pages | 5.5h | done |
| 6 | Real auth (Firebase), hardening, APK (staged), demo video | 4h | auth done |

Every phase ends running on device, lint + typecheck clean, no dead taps, both themes correct.

## Firebase setup

- Config files: `GoogleService-Info.plist` (iOS) and `google-services.json` (Android), referenced from `app.json`. Bundle id / package: `com.anonymous.campaignapp`.
- Plugins: `@react-native-firebase/app` (CocoaPods mode, `disableSPM`), `@react-native-firebase/auth`, and `expo-build-properties` with iOS static frameworks (`forceStaticLinking: RNFBApp, RNFBAuth`).
- Firebase console: enable **Authentication → Sign-in method → Email/Password**. Create the test account (`demo@campaigns.app` / `demo1234`) there or with "Create account" in the app; it owns the seeded sample campaigns.
- After changing native config: `npx expo prebuild --clean`, then `npm run ios` / `npm run android`.

## Cut order (first to cut)

1. Confetti 2. Reverse hero animation 3. Video creatives 4. Creator-posted updates 5. Report charts → tables 6. Fine-grained notification preferences

Never cut: the full 5-step flow, autosave/resume, all four payment outcomes, estimate labelling, use of funds, lifecycle demo, loading/empty/error states.
