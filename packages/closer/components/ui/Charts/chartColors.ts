import themeColors from '../../../theme.js';

/**
 * `theme.js` is untyped JavaScript, so its colour tokens come back as `unknown`
 * — coerce them to the strings Recharts expects for `stroke`/`fill`, falling
 * back to a neutral grey for a theme that never defined the token.
 */
const themeColor = (token: string, fallback: string): string => {
  const value = themeColors?.extend?.colors?.[token];
  return typeof value === 'string' ? value : fallback;
};

export const CHART_COLORS: string[] = [
  '#C2A3B6',
  '#565E6C',
  themeColor('accent', '#8C8C8C'),
  themeColor('accent-alt', '#6E6E6E'),
  themeColor('accent-dark', '#4A4A4A'),
  '#AFAFAF',
  '#FF6B6B',
];
