# Build plan — Campaigns (Campaign Amplification Platform)

Source of truth for product rules: the hackathon PRD. This file records the approved build plan and decisions.

## Stack

Expo SDK 57 · RN 0.86 (New Architecture) · Expo Router (custom JS tab bar via `expo-router/js-tabs`) · Reanimated 4 + Gesture Handler · Zustand · TanStack Query · react-hook-form + zod · expo-haptics · expo-image · expo-image-picker · custom floating bottom sheet (one implementation, both platforms) · FlashList · Phosphor icons · Inter + Source Serif 4.

Everything must run in **Expo Go**. Not in Expo Go → worked around:

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
6. Real auth (final phase): Supabase, email + password.
7. EAS / APK build: staged — discuss before running.
8. Primary test device: iOS (Expo Go).
9. Commit at the end of each phase.

## Architecture rules

- `src/app/` holds routes only. Screens use `src/features/*` hooks, never `src/services/mock` (ESLint-enforced).
- Every data call goes through typed contracts in `src/services/contracts.ts`; `src/services/index.ts` picks the implementation (`EXPO_PUBLIC_BACKEND=mock|supabase`).
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
| 6 | Real auth (Supabase), hardening, APK (staged), demo video | 4h | |

Every phase ends running in Expo Go, lint + typecheck clean, no dead taps, both themes correct.

## Cut order (first to cut)

1. Confetti 2. Reverse hero animation 3. Video creatives 4. Creator-posted updates 5. Report charts → tables 6. Fine-grained notification preferences

Never cut: the full 5-step flow, autosave/resume, all four payment outcomes, estimate labelling, use of funds, lifecycle demo, loading/empty/error states.
