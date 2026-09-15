// ─── Design tokens ────────────────────────────────────────────────────────────
// Deep navy→forest chrome for headers, a vivid green for every action, and clean
// white surfaces for content. Sizes are deliberately compact — this is a dense
// data app, not a marketing page.

export const colors = {
  /** Primary action color — buttons, active tabs, selected states. */
  brand: '#16A34A',
  brandDark: '#15803D',
  /** Lighter green for gradient highlights and accents on dark chrome. */
  brandBright: '#22C55E',
  brandSoft: '#DCFCE7',
  brandTint: '#F0FDF4',

  /** Navy used by header bands and the logo tile. */
  chrome: '#0B2536',
  chromeDeep: '#061825',
  /** Forest green the chrome gradient fades into. */
  chromeGreen: '#0B3A30',
  onChrome: '#FFFFFF',
  onChromeMuted: 'rgba(255, 255, 255, 0.72)',
  onChromeFaint: 'rgba(255, 255, 255, 0.55)',
  /** Frosted fill for chips and icon buttons sitting on chrome. */
  chromeGlass: 'rgba(255, 255, 255, 0.12)',
  chromeGlassBorder: 'rgba(255, 255, 255, 0.16)',

  bg: '#F3F6F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F7FAF9',
  overlay: 'rgba(6, 24, 37, 0.5)',

  border: '#E3E9E7',
  borderStrong: '#D0DAD7',

  text: '#0B1E2B',
  textMuted: '#526270',
  textFaint: '#8694A0',
  onBrand: '#FFFFFF',

  success: '#059669',
  successTint: '#ECFDF5',
  warning: '#D97706',
  warningTint: '#FFFBEB',
  danger: '#DC2626',
  dangerTint: '#FEF2F2',
  dangerBorder: '#FBD5D5',
  info: '#2563EB',
  infoTint: '#EFF6FF',
  violet: '#7C3AED',
  violetTint: '#F5F3FF',
  neutralTint: '#EEF3F1',
} as const;

/** Gradient stops — typed as tuples because expo-linear-gradient requires ≥ 2. */
export const gradients = {
  /** Header bands and the logo tile: navy top-left fading to forest green. */
  chrome: [colors.chromeDeep, colors.chrome, colors.chromeGreen],
  /** Primary buttons: bright green easing into the deeper brand green. */
  brand: [colors.brandBright, colors.brand, colors.brandDark],
} as const;

export const spacing = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const font = {
  xs: 11,
  sm: 12,
  md: 13,
  lg: 15,
  xl: 17,
  xxl: 21,
  display: 26,
} as const;

/** Page gutter — one value so every screen lines up down the left edge. */
export const SCREEN_PADDING = 14;

export const shadow = {
  card: {
    shadowColor: '#0B1E2B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#0B1E2B',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  /** Soft green glow under primary buttons. */
  brand: {
    shadowColor: colors.brand,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  /** Bottom nav — shadow is cast upward. */
  nav: {
    shadowColor: '#0B1E2B',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
  },
} as const;

/** Status tones shared by badges, dots and chart series. */
export const tone = {
  success: { fg: colors.success, bg: colors.successTint },
  warning: { fg: colors.warning, bg: colors.warningTint },
  danger: { fg: colors.danger, bg: colors.dangerTint },
  info: { fg: colors.info, bg: colors.infoTint },
  violet: { fg: colors.violet, bg: colors.violetTint },
  brand: { fg: colors.brand, bg: colors.brandTint },
  neutral: { fg: colors.textMuted, bg: colors.neutralTint },
} as const;

export type ToneName = keyof typeof tone;
