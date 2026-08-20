export interface ThemeFont {
  id: string;
  label: string;
  googleFamily?: string;
  cssVariable?: string;
  stack: string[];
  serif?: boolean;
  apps?: string[];
}

export interface ThemeColorField {
  key: string;
  tokens: string[];
  derived?: Record<string, (color: string) => string | undefined>;
}

export interface ThemingConfigValue {
  enabled?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  fontFamilyBody?: string;
  fontFamilyHeading?: string;
  [key: string]: unknown;
}

export interface TailwindThemeLike {
  extend?: {
    colors?: Record<string, unknown>;
    fontFamily?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ThemeColorToken {
  token: string;
  group: string;
  derivedFrom?: string;
}

export declare const THEME_FONTS: ThemeFont[];
export declare const THEME_COLOR_TOKENS: ThemeColorToken[];
export declare const THEME_COLOR_GROUPS: string[];
export declare const THEME_FONT_SLOTS: string[];
export declare function colorTokenConfigKey(token: string): string;
export declare function fontSlotConfigKey(slot: string): string;
export declare const THEME_COLOR_FIELDS: ThemeColorField[];

export declare function isHexColor(value: unknown): boolean;
export declare function mix(color: string, target: string, amount: number): string;
export declare function tint(color: string, amount: number): string;
export declare function shade(color: string, amount: number): string;
export declare function contrastOn(color: string): string | undefined;
export declare function contrastRatio(color: string, other: string): number;
export declare function readableOn(
  color: string,
  background: string,
  target?: number,
): string;
export declare function resolveFontStack(fontId?: string): string[] | null;
export declare function fontStackToCss(
  stack?: string[] | null,
): string | undefined;
export declare function getGoogleFontsUrl(
  theming?: ThemingConfigValue | null,
): string | null;
export declare function getSelectableThemeFonts(appName?: string): ThemeFont[];
export declare const THEME_DEFAULTS: Required<
  Pick<
    ThemingConfigValue,
    | 'primaryColor'
    | 'secondaryColor'
    | 'backgroundColor'
    | 'foregroundColor'
    | 'fontFamilyBody'
    | 'fontFamilyHeading'
  >
> &
  Record<string, string>;
export declare const SYSTEM_COLORS: Record<string, string>;
export declare const BASE_THEME_EXTEND: Record<string, unknown>;
export declare function buildThemeColors(
  theming?: ThemingConfigValue | null,
): Record<string, string>;
export declare function buildThemeFonts(
  theming?: ThemingConfigValue | null,
  layoutFonts?: Record<string, string>,
): Record<string, string[]>;
export declare function buildTheme(
  theming?: ThemingConfigValue | null,
  layoutFonts?: Record<string, string>,
): TailwindThemeLike;
export declare function getThemingFromSnapshot(
  snapshot?: Record<string, unknown> | null,
): ThemingConfigValue;
