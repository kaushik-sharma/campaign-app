import { Easing, type WithSpringConfig } from 'react-native-reanimated';

/**
 * Design tokens. Every visual value in the app comes from here.
 * Direction: "editorial fintech" — warm paper neutrals, ink text, one restrained indigo accent.
 */

const light = {
  bg: '#F7F7F4',
  surface: '#FFFFFF',
  surfaceSunken: '#EFEFEA',
  surfaceInverse: '#121417',
  border: '#E3E3DD',
  borderStrong: '#CFCFC7',
  text: '#121417',
  textMuted: '#5A606A',
  textInverse: '#FFFFFF',
  textDisabled: '#A3A7AD',
  primary: '#3341C4',
  primaryPressed: '#2A36A6',
  primarySoft: '#EBEDFB',
  onPrimary: '#FFFFFF',
  success: '#1F7A4D',
  successSoft: '#E5F3EB',
  warning: '#A8620A',
  warningSoft: '#FBF0DF',
  danger: '#BE3A2F',
  dangerSoft: '#FBE9E7',
  overlay: 'rgba(18, 20, 23, 0.45)',
  shimmerBase: '#ECECE7',
  shimmerHighlight: 'rgba(255, 255, 255, 0.75)',
};

export type ColorTokens = typeof light;

const dark: ColorTokens = {
  bg: '#0B0C0E',
  surface: '#141619',
  surfaceSunken: '#1B1E22',
  surfaceInverse: '#F1F2F4',
  border: '#272A30',
  borderStrong: '#363A42',
  text: '#F1F2F4',
  textMuted: '#A2A8B3',
  textInverse: '#0B0C0E',
  textDisabled: '#5C616A',
  primary: '#8F9BFF',
  primaryPressed: '#7A87F0',
  primarySoft: '#1D2142',
  onPrimary: '#0B0C0E',
  success: '#4CC38A',
  successSoft: '#12291E',
  warning: '#F0A647',
  warningSoft: '#2D2112',
  danger: '#FF7A6E',
  dangerSoft: '#2E1614',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shimmerBase: '#1B1E22',
  shimmerHighlight: 'rgba(255, 255, 255, 0.06)',
};

export const palette = { light, dark } as const;

/** Muted category tints for chips and placeholder covers. [light, dark] */
export const categoryTints = {
  environment: ['#E3EFE6', '#16271C'],
  health: ['#F6E6E4', '#2C1917'],
  science: ['#E4EBF6', '#151E2C'],
  education: ['#F4EDDD', '#2A2313'],
  'public-policy': ['#E8E6F4', '#1D1A2E'],
  'economic-policy': ['#E2EEEE', '#142526'],
  community: ['#F3E7EE', '#2A1823'],
  'arts-culture': ['#F2E9E0', '#2A1F15'],
  business: ['#E6E9EC', '#1B1F23'],
  other: ['#ECECE7', '#1E2024'],
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  serif: 'SourceSerif4_400Regular',
  serifItalic: 'SourceSerif4_400Regular_Italic',
  serifSemibold: 'SourceSerif4_600SemiBold',
} as const;

type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
};

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  title1: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  title2: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  title3: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.1 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  subhead: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  footnote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  amount: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 32, letterSpacing: -0.4 },
  hero: { fontFamily: fonts.serifSemibold, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  storyTitle: { fontFamily: fonts.serifSemibold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  storyHeading: { fontFamily: fonts.serifSemibold, fontSize: 21, lineHeight: 28 },
  storyBody: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 28 },
} satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typography;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
  '6xl': 72,
} as const;

export const layout = {
  gutter: 20,
  cardPadding: 16,
  sectionGap: 32,
  minTouch: 44,
  tabBarHeight: 64,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Cross-platform boxShadow (RN New Architecture). Dark mode relies on surfaces + borders instead. */
export const elevation = {
  e0: undefined,
  e1: '0px 1px 2px rgba(16, 18, 22, 0.06), 0px 1px 1px rgba(16, 18, 22, 0.04)',
  e2: '0px 6px 20px rgba(16, 18, 22, 0.10)',
  e3: '0px 16px 40px rgba(16, 18, 22, 0.18)',
} as const;

export type ElevationLevel = keyof typeof elevation;

export const duration = {
  instant: 90,
  fast: 150,
  base: 220,
  slow: 320,
  deliberate: 480,
  counter: 900,
} as const;

export const easing = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  enter: Easing.bezier(0.05, 0.7, 0.1, 1),
  exit: Easing.bezier(0.3, 0, 0.8, 0.15),
} as const;

export const spring = {
  press: { damping: 22, stiffness: 420, mass: 0.6 },
  snappy: { damping: 20, stiffness: 300, mass: 0.8 },
  gentle: { damping: 24, stiffness: 170, mass: 1 },
  sheet: { damping: 30, stiffness: 260, mass: 1 },
  hero: { damping: 26, stiffness: 220, mass: 0.9 },
  celebrate: { damping: 11, stiffness: 180, mass: 1 },
} satisfies Record<string, WithSpringConfig>;

export const motion = {
  pressScale: { card: 0.97, button: 0.96, row: 0.985 },
  staggerMs: 40,
  staggerCap: 6,
} as const;
