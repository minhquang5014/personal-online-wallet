/**
 * Design tokens dùng chung cho toàn app.
 * Giữ ở một chỗ để sau này đổi theme / dark mode dễ dàng.
 */

export const colors = {
  // Brand
  primary: '#2E6BE6',
  primaryDark: '#1B4FC0',
  primarySoft: '#E8F0FE',

  // Semantic
  income: '#16A34A',
  incomeSoft: '#DCFCE7',
  expense: '#EF4444',
  expenseSoft: '#FEE2E2',

  // Neutrals
  background: '#F4F6FA',
  card: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  border: '#E5E7EB',
  white: '#FFFFFF',

  // Tab bar
  tabActive: '#2E6BE6',
  tabInactive: '#9CA3AF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const font = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;
