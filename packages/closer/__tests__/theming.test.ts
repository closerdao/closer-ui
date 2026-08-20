import {
  SYSTEM_COLORS,
  THEME_COLOR_TOKENS,
  THEME_DEFAULTS,
  THEME_FONT_SLOTS,
  colorTokenConfigKey,
  fontSlotConfigKey,
  buildTheme,
  buildThemeColors,
  buildThemeFonts,
  contrastOn,
  getGoogleFontsUrl,
  getThemingFromSnapshot,
  isHexColor,
  resolveFontStack,
} from '../theming';

/**
 * Every colour token the components reference. `buildThemeColors` is the only
 * thing standing between these and an undefined Tailwind class now that no app
 * declares a palette of its own, so a token dropped here is a silently broken
 * style everywhere it is used.
 */
const REQUIRED_TOKENS = [
  'accent',
  'accent-alt',
  'accent-alt-dark',
  'accent-alt-light',
  'accent-alt-medium',
  'accent-core',
  'accent-dark',
  'accent-foreground',
  'accent-light',
  'accent-medium',
  'background',
  'background-dark',
  'card',
  'card-foreground',
  'complimentary',
  'complimentary-core',
  'complimentary-light',
  'complimentary-medium',
  'disabled',
  'dominant',
  'error',
  'failure',
  'foreground',
  'foreground-dark',
  'line',
  'neon-dark',
  'neutral',
  'neutral-dark',
  'neutral-light',
  'pending',
  'primary',
  'primary-foreground',
  'primary-light',
  'secondary',
  'secondary-foreground',
  'success',
];

describe('isHexColor', () => {
  it('accepts 3- and 6-digit hex, rejects anything else', () => {
    expect(isHexColor('#abc')).toBe(true);
    expect(isHexColor('#1B3BC3')).toBe(true);
    expect(isHexColor('  #123456  ')).toBe(true);
    expect(isHexColor('#12345')).toBe(false);
    expect(isHexColor('rebeccapurple')).toBe(false);
    expect(isHexColor('')).toBe(false);
    expect(isHexColor(undefined)).toBe(false);
  });
});

describe('buildThemeColors', () => {
  it('always emits every token the components use', () => {
    for (const theming of [{}, null, { primaryColor: '#3ee08f' }]) {
      const colors = buildThemeColors(theming);
      const missing = REQUIRED_TOKENS.filter((token) => !(token in colors));
      expect({ theming, missing }).toEqual({ theming, missing: [] });
    }
  });

  it('falls back to the neutral defaults when nothing is configured', () => {
    const colors = buildThemeColors({});
    expect(colors.accent).toBe(THEME_DEFAULTS.primaryColor);
    expect(colors.secondary).toBe(THEME_DEFAULTS.secondaryColor);
    expect(colors.background).toBe(THEME_DEFAULTS.backgroundColor);
    expect(colors.foreground).toBe(THEME_DEFAULTS.foregroundColor);
  });

  /**
   * The greyscale scaffolding the components were built against — these used to
   * be hardcoded in every app's theme.js, and the default ratios are chosen so
   * removing those files did not shift them.
   */
  it('keeps the structural greys where they have always been', () => {
    const colors = buildThemeColors({});
    expect(colors.line).toBe('#a3a3a3');
    expect(colors.neutral).toBe('#f0f0f0');
    expect(colors['neutral-dark']).toBe('#ebebeb');
    expect(colors['complimentary-light']).toBe('#333333');
  });

  it('drives accent as well as primary, since accent is what components paint with', () => {
    const colors = buildThemeColors({ primaryColor: '#3ee08f' });
    expect(colors.primary).toBe('#3ee08f');
    expect(colors.accent).toBe('#3ee08f');
    expect(colors['accent-core']).toBe('#3ee08f');
  });

  it('derives hover, tint and contrast companions from a single colour', () => {
    const colors = buildThemeColors({ primaryColor: '#1b3bc3' });
    expect(colors['accent-dark']).toBe('#1834ac');
    expect(colors['accent-light']).toBe('#e4e7f8');
    expect(colors['accent-foreground']).toBe('#ffffff');
  });

  it('picks dark text on a pale brand colour instead of unreadable white', () => {
    const colors = buildThemeColors({ primaryColor: '#97ffd4' });
    expect(colors['accent-foreground']).not.toBe('#ffffff');
    expect(contrastOn('#97ffd4')).toBe(colors['accent-foreground']);
  });

  it('normalises shorthand hex and ignores malformed values', () => {
    expect(buildThemeColors({ primaryColor: '#f0a' }).primary).toBe('#ff00aa');
    expect(buildThemeColors({ primaryColor: 'not-a-colour' }).primary).toBe(
      THEME_DEFAULTS.primaryColor,
    );
  });

  it('leaves the semantic colours alone whatever the brand is', () => {
    const colors = buildThemeColors({
      primaryColor: '#3ee08f',
      foregroundColor: '#000000',
    });
    expect(colors.success).toBe(SYSTEM_COLORS.success);
    expect(colors.error).toBe(SYSTEM_COLORS.error);
    expect(colors.pending).toBe(SYSTEM_COLORS.pending);
    expect(colors.failure).toBe(SYSTEM_COLORS.failure);
  });

  it('only lets a configured field move its own tokens', () => {
    const colors = buildThemeColors({ primaryColor: '#1b3bc3' });
    expect(colors.background).toBe(THEME_DEFAULTS.backgroundColor);
    expect(colors.foreground).toBe(THEME_DEFAULTS.foregroundColor);
    expect(colors.secondary).toBe(THEME_DEFAULTS.secondaryColor);
  });
});

describe('buildThemeFonts', () => {
  it('makes no external font request by default', () => {
    const fonts = buildThemeFonts({});
    expect(fonts.sans[0]).toBe('ui-sans-serif');
    expect(fonts.serif[0]).toBe('ui-serif');
    expect(getGoogleFontsUrl({})).toBeNull();
  });

  it('maps the body font onto sans and the heading font onto the display tokens', () => {
    const fonts = buildThemeFonts({
      fontFamilyBody: 'inter',
      fontFamilyHeading: 'playfair-display',
    });
    expect(fonts.sans[0]).toBe('Inter');
    expect(fonts.body[0]).toBe('Inter');
    expect(fonts.display[0]).toBe('Playfair Display');
    // `font-accent` is used for nav CTAs and hero copy in shared components.
    expect(fonts.accent[0]).toBe('Playfair Display');
  });

  it('falls the heading tokens back to the body font when only a body font is set', () => {
    const fonts = buildThemeFonts({ fontFamilyBody: 'lato' });
    expect(fonts.display[0]).toBe('Lato');
    expect(fonts.accent[0]).toBe('Lato');
  });

  it('gives serif faces a serif fallback chain', () => {
    expect(resolveFontStack('lora')).toContain('Georgia');
    expect(resolveFontStack('inter')).toContain('system-ui');
  });

  it('ignores unknown font ids rather than emitting a broken stack', () => {
    expect(buildThemeFonts({ fontFamilyBody: 'comic-sans' }).sans[0]).toBe(
      'ui-sans-serif',
    );
    expect(resolveFontStack(undefined)).toBeNull();
  });
});

describe('getGoogleFontsUrl', () => {
  it('requests each configured family once', () => {
    const url = getGoogleFontsUrl({
      fontFamilyBody: 'work-sans',
      fontFamilyHeading: 'work-sans',
    }) as string;
    expect(url.match(/family=/g)).toHaveLength(1);
    expect(url).toContain('Work%20Sans');
    expect(url).toContain('display=swap');
  });

  it('requests both families when body and heading differ', () => {
    const url = getGoogleFontsUrl({
      fontFamilyBody: 'inter',
      fontFamilyHeading: 'lora',
    }) as string;
    expect(url.match(/family=/g)).toHaveLength(2);
  });
});

describe('buildTheme', () => {
  it('produces a complete Tailwind theme with no app-supplied palette', () => {
    const theme = buildTheme({ primaryColor: '#3ee08f' });
    expect(theme.extend?.colors?.accent).toBe('#3ee08f');
    expect(theme.extend?.fontFamily).toBeDefined();
    // Structural values the components animate against survive the rebuild.
    expect(theme.extend?.boxShadow).toBeDefined();
    expect(theme.extend?.animation).toHaveProperty('sparkle-float');
    expect(theme.extend?.keyframes).toHaveProperty('fade-in');
  });

  it('is what every app compiles, so two apps agree unless their config differs', () => {
    expect(buildTheme({ primaryColor: '#111111' })).toEqual(
      buildTheme({ primaryColor: '#111111' }),
    );
    expect(buildTheme({ primaryColor: '#111111' })).not.toEqual(
      buildTheme({ primaryColor: '#222222' }),
    );
  });
});

describe('getThemingFromSnapshot', () => {
  it('reads the theming bucket and shrugs off anything else', () => {
    expect(getThemingFromSnapshot({ theming: { primaryColor: '#fff' } })).toEqual(
      { primaryColor: '#fff' },
    );
    expect(getThemingFromSnapshot({})).toEqual({});
    expect(getThemingFromSnapshot(null)).toEqual({});
    expect(getThemingFromSnapshot({ theming: [] } as any)).toEqual({});
    expect(getThemingFromSnapshot({ theming: 'nope' } as any)).toEqual({});
  });
});

describe('per-token overrides', () => {
  it('exposes at least as many options as the hardcoded themes declared', () => {
    // The old theme.js files declared 33 colours and 5 fontFamily slots.
    const options =
      4 + THEME_COLOR_TOKENS.length + 2 + THEME_FONT_SLOTS.length;
    expect(options).toBeGreaterThanOrEqual(38);
    expect(THEME_COLOR_TOKENS.length).toBe(REQUIRED_TOKENS.length);
  });

  it('lets an explicit token override beat what the source colour derived', () => {
    const colors = buildThemeColors({
      primaryColor: '#3ee08f',
      [colorTokenConfigKey('accent-dark')]: '#000000',
    });
    expect(colors['accent-dark']).toBe('#000000');
    // Its siblings still follow the source colour.
    expect(colors.accent).toBe('#3ee08f');
    expect(colors['accent-light']).toBe(
      buildThemeColors({ primaryColor: '#3ee08f' })['accent-light'],
    );
  });

  it('can pin a semantic colour that no source derives', () => {
    expect(
      buildThemeColors({ [colorTokenConfigKey('success')]: '#00ff00' }).success,
    ).toBe('#00ff00');
  });

  it('ignores a malformed override rather than emitting broken CSS', () => {
    const colors = buildThemeColors({
      primaryColor: '#3ee08f',
      [colorTokenConfigKey('accent-dark')]: 'nope',
    });
    expect(colors['accent-dark']).toBe(
      buildThemeColors({ primaryColor: '#3ee08f' })['accent-dark'],
    );
  });

  it('gives every token a config key, and every key a unique name', () => {
    const keys = THEME_COLOR_TOKENS.map(({ token }) =>
      colorTokenConfigKey(token),
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(colorTokenConfigKey('accent-alt-light')).toBe('colorAccentAltLight');
  });
});

describe('font slot overrides', () => {
  it('lets one slot differ without moving the rest', () => {
    const fonts = buildThemeFonts({
      fontFamilyBody: 'inter',
      [fontSlotConfigKey('accent')]: 'space-grotesk',
    });
    expect(fonts.accent[0]).toBe('Space Grotesk');
    expect(fonts.sans[0]).toBe('Inter');
    expect(fonts.display[0]).toBe('Inter');
  });

  it('loads a slot-only font from Google too, or it would never render', () => {
    const url = getGoogleFontsUrl({
      [fontSlotConfigKey('display')]: 'lora',
    }) as string;
    expect(url).toContain('Lora');
  });
});
