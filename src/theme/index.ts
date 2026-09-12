// ─── Design tokens ────────────────────────────────────────────────────────────
// The palette mirrors the web portal's premium amber/slate chrome so the app and
// the website read as one product. Sizes are deliberately compact — this is a
// dense data app, not a marketing page.

export const colors = {
  /** Primary action color — matches the portal's amber-700 buttons. */
  brand: '#B45309',
  brandDark: '#92400E',
  /** Espresso used for headers and the login hero, same as the web sidebar. */
  brandDeep: '#4A270A',
  brandDeeper: '#2B1706',
  brandSoft: '#FEF3C7',
  brandTint: '#FFFBEB',

  bg: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  overlay: 'rgba(15, 23, 42, 0.45)',

  border: '#E7EAEF',
  borderStrong: '#D6DBE3',

  text: '#0F172A',
  textMuted: '#5B6675',
  textFaint: '#8A93A2',
  onBrand: '#FFFFFF',

  success: '#059669',
  successTint: '#ECFDF5',
  warning: '#D97706',
  warningTint: '#FFFBEB',
  danger: '#DC2626',
  dangerTint: '#FEF2F2',
  info: '#0284C7',
  infoTint: '#F0F9FF',
  neutralTint: '#F1F5F9',
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
  md: 10,
  lg: 14,
  xl: 18,
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
    shadowColor: '#0B1220',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#0B1220',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  /** Bottom nav — shadow is cast upward. */
  nav: {
    shadowColor: '#0B1220',
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
  brand: { fg: colors.brand, bg: colors.brandTint },
  neutral: { fg: colors.textMuted, bg: colors.neutralTint },
} as const;

export type ToneName = keyof typeof tone;
