import { config as configBase } from '@tamagui/config';
import { createTamagui, createTokens } from 'tamagui';

const tokens = createTokens({
  ...configBase.tokens,
  color: {
    ...configBase.tokens.color,
    // Fondos
    bg100: '#0F1117',
    bg200: '#1A1D26',
    bg300: '#22263A',
    bg400: '#2A2F47',
    // Azul
    blue400: '#60A5FA',
    blue500: '#3B82F6',
    blue600: '#2563EB',
    blue700: '#1D4ED8',
    accent:  '#4F6EF7',
    // Texto
    textPrimary:   '#FFFFFF',
    textSecondary: '#A8AEBF',
    textMuted:     '#5C6175',
    // Semánticos
    success: '#10B981',
    warning: '#F59E0B',
    error:   '#EF4444',
    // Roles
    client:  '#0EA5E9',
    seller:  '#8B5CF6',
    // Legacy (transición)
    white: '#FFFFFF',
  },
});

const config = createTamagui({
  ...configBase,
  tokens,
  animations: {
    bouncy: { type: 'spring', damping: 10, mass: 0.9, stiffness: 100 },
    spring: { type: 'spring', damping: 15, mass: 0.8, stiffness: 120 },
    fast:   { type: 'spring', damping: 22, stiffness: 250 },
    quick:  { type: 'spring', damping: 25, stiffness: 300 },
    slow:   { type: 'spring', damping: 18, stiffness: 60 },
    lazy:   { type: 'spring', damping: 16, stiffness: 40 },
  } as any,
  themes: {
    ...configBase.themes,
    dark: {
      ...configBase.themes.dark,
      background:      '#0F1117',
      backgroundHover: '#1A1D26',
      backgroundPress: '#22263A',
      borderColor:     'rgba(255,255,255,0.10)',
      color:           '#FFFFFF',
      colorSecondary:  '#A8AEBF',
      primary:         '#3B82F6',
    },
    light: {
      ...configBase.themes.light,
      background:      '#F9FAFB',
      backgroundHover: '#F3F4F6',
      backgroundPress: '#E5E7EB',
      borderColor:     '#E5E7EB',
      color:           '#111827',
      primary:         '#2563EB',
    },
  },
});

export type Conf = typeof config;
declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config;
