/**
 * Theming — the bridge between the `theming` config bucket an admin edits in
 * /dashboard/theming and the Tailwind theme each app compiles.
 *
 * This file is plain CommonJS on purpose: it is required both by the apps'
 * `tailwind.config.js` (a Node build script, no TS pipeline) and by the React
 * editor, so the palette an admin previews is derived by exactly the same code
 * that emits the compiled classes. `theming.d.ts` types it for the TS side.
 *
 * The pipeline is static, like the rest of the config: `sync-build-config`
 * writes the API's config into `generated/appConfig.snapshot.json`, `theme.js`
 * feeds the `theming` bucket to `buildTheme`, and Tailwind compiles the result.
 * No app declares a palette of its own any more. Saving a colour therefore
 * takes effect on the next build, not on the next page load — `ThemeStyles` is
 * what makes a newly chosen font reach the browser at runtime.
 */

/* ---------------------------------------------------------------- colours */

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** True for the `#rgb` / `#rrggbb` strings the editor's colour input emits. */
function isHexColor(value) {
  return typeof value === 'string' && HEX_RE.test(value.trim());
}

function parseHex(value) {
  if (!isHexColor(value)) return null;
  let hex = value.trim().slice(1);
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const int = parseInt(hex, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function toHex({ r, g, b }) {
  const channel = (n) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Mix `color` with `target` — `amount` 0 keeps the colour, 1 becomes target. */
function mix(color, target, amount) {
  const from = parseHex(color);
  if (!from) return color;
  const to = parseHex(target);
  if (!to) return color;
  return toHex({
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  });
}

/** A lighter tint of `color`, for `-light` / `-medium` surface tokens. */
function tint(color, amount) {
  return mix(color, '#ffffff', amount);
}

/** A darker shade of `color`, for the `-dark` hover tokens. */
function shade(color, amount) {
  return mix(color, '#000000', amount);
}

function relativeLuminance(color) {
  const rgb = parseHex(color);
  if (!rgb) return 1;
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  );
}

/**
 * Text/icon colour to sit on a `color` fill. A community that picks a pale
 * brand colour would otherwise get white-on-mint buttons, so pick the darker
 * or lighter end of their own hue rather than a flat black/white.
 */
function contrastOn(color) {
  if (!isHexColor(color)) return undefined;
  return relativeLuminance(color) > 0.45 ? shade(color, 0.75) : '#ffffff';
}

/** WCAG contrast ratio between two hex colours. */
function contrastRatio(color, other) {
  const a = relativeLuminance(color);
  const b = relativeLuminance(other);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * `color` adjusted until it is legible *as text* on `background`.
 *
 * The same brand colour has to work as a button fill and as a link, and one
 * value cannot always do both: mint behind white button text is fine and
 * unreadable on a white page (~1.6:1). Darken (or lighten, on a dark
 * background) in small steps until the pair clears AA for body text. A colour
 * that already passes comes back untouched, so a platform whose accent is
 * readable sees no change at all.
 */
function readableOn(color, background, target = 4.5) {
  if (!isHexColor(color) || !isHexColor(background)) return color;
  const darken = relativeLuminance(background) > 0.5;
  let candidate = color;
  for (let step = 0; step < 24; step += 1) {
    if (contrastRatio(candidate, background) >= target) return candidate;
    candidate = darken ? shade(candidate, 0.06) : tint(candidate, 0.06);
  }
  return candidate;
}

/* ------------------------------------------------------------------ fonts */

/**
 * Fonts an admin can choose. Every one is on Google Fonts, which is what
 * `ThemeStyles` loads them from — a font that is not here has no stylesheet to
 * request, so the stack would silently fall through to the system default.
 * `stack` is what lands in the compiled Tailwind `fontFamily`.
 */
const THEME_FONTS = [
  { id: 'inter', label: 'Inter', googleFamily: 'Inter', stack: ['Inter'] },
  { id: 'barlow', label: 'Barlow', googleFamily: 'Barlow', stack: ['Barlow'] },
  {
    id: 'raleway',
    label: 'Raleway',
    googleFamily: 'Raleway',
    stack: ['Raleway'],
  },
  { id: 'lato', label: 'Lato', googleFamily: 'Lato', stack: ['Lato'] },
  {
    id: 'montserrat',
    label: 'Montserrat',
    googleFamily: 'Montserrat',
    stack: ['Montserrat'],
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    googleFamily: 'Open Sans',
    stack: ['Open Sans'],
  },
  { id: 'poppins', label: 'Poppins', googleFamily: 'Poppins', stack: ['Poppins'] },
  {
    id: 'work-sans',
    label: 'Work Sans',
    googleFamily: 'Work Sans',
    stack: ['Work Sans'],
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    googleFamily: 'Space Grotesk',
    stack: ['Space Grotesk'],
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    googleFamily: 'DM Sans',
    stack: ['DM Sans'],
  },
  {
    id: 'playfair-display',
    label: 'Playfair Display',
    googleFamily: 'Playfair Display',
    stack: ['Playfair Display'],
    serif: true,
  },
  {
    id: 'lora',
    label: 'Lora',
    googleFamily: 'Lora',
    stack: ['Lora'],
    serif: true,
  },
  {
    id: 'instrument-serif',
    label: 'Instrument Serif',
    googleFamily: 'Instrument Serif',
    stack: ['Instrument Serif'],
    serif: true,
  },
  {
    id: 'crimson-pro',
    label: 'Crimson Pro',
    googleFamily: 'Crimson Pro',
    stack: ['Crimson Pro'],
    serif: true,
  },
];

const SANS_FALLBACKS = [
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'Segoe UI',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
];

const SERIF_FALLBACKS = ['ui-serif', 'Georgia', 'Cambria', 'serif'];

function findFont(fontId) {
  if (!fontId || typeof fontId !== 'string') return null;
  return THEME_FONTS.find((font) => font.id === fontId) || null;
}

/**
 * The full CSS font stack for a configured font id, or null when the id is
 * unset or unknown — callers keep the app's own `fontFamily` in that case.
 */
function resolveFontStack(fontId) {
  const font = findFont(fontId);
  if (!font) return null;
  return [...font.stack, ...(font.serif ? SERIF_FALLBACKS : SANS_FALLBACKS)];
}

/**
 * The Google Fonts stylesheet URL covering every configured font, or null when
 * nothing is configured. Weights span 300–800 so the existing `font-black`
 * headings still have a face to use.
 */
function getGoogleFontsUrl(theming) {
  const value = theming || {};
  const families = [
    value.fontFamilyBody,
    value.fontFamilyHeading,
    ...THEME_FONT_SLOTS.map((slot) => value[fontSlotConfigKey(slot)]),
  ]
    .map((id) => findFont(id))
    .filter(Boolean)
    .map((font) => font.googleFamily);
  const unique = [...new Set(families)];
  if (unique.length === 0) return null;

  const params = unique
    .map((family) => `family=${encodeURIComponent(family)}:wght@300;400;500;600;700;800`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/* ------------------------------------------------------- colour → tokens */

/**
 * The neutral palette a platform starts on. Deliberately greyscale: a village
 * that has not opened the Theming page yet should look unbranded and legible,
 * never like it inherited somebody else's identity (#946). These are also the
 * `default`s the `theming` config schema advertises, so the editor, the config
 * document and this build agree on one set of values.
 */
const THEME_DEFAULTS = {
  primaryColor: '#3F444C',
  secondaryColor: '#6B7280',
  backgroundColor: '#FFFFFF',
  foregroundColor: '#1A1A1A',
  fontFamilyBody: '',
  fontFamilyHeading: '',
};

/**
 * Semantic colours, fixed on purpose. Success/failure/pending carry meaning a
 * community should not be able to make ambiguous, and the `-dark` pair is the
 * dark-mode ground rather than part of anyone's brand.
 */
const SYSTEM_COLORS = {
  error: '#9F1F42',
  failure: '#DB4726',
  success: '#58B741',
  pending: '#E8AB1B',
  'background-dark': '#1C1C1C',
  'foreground-dark': '#DADADA',
  'neon-dark': '#42CC93',
};

/**
 * How each configured colour fans out into the Tailwind tokens the components
 * actually paint with. `tokens` take the colour as-is; `derived` computes the
 * hover/tint/contrast companions, with ratios chosen so the greyscale defaults
 * land on the same values the palette used to hardcode (`line` at #A3A3A3,
 * `neutral` at #F0F0F0, and so on).
 *
 * `primaryColor` owns `accent` as well as `primary` because `accent` is the
 * token the shared components overwhelmingly use — driving only `primary`
 * would make the setting look broken.
 */
const THEME_COLOR_FIELDS = [
  {
    key: 'primaryColor',
    tokens: ['primary', 'accent', 'accent-core'],
    derived: {
      'accent-dark': (color) => shade(color, 0.12),
      'accent-medium': (color) => tint(color, 0.6),
      'accent-light': (color) => tint(color, 0.88),
      'primary-light': (color) => tint(color, 0.92),
      'accent-foreground': (color) => contrastOn(color),
      'primary-foreground': (color) => contrastOn(color),
    },
  },
  {
    key: 'secondaryColor',
    tokens: ['secondary', 'accent-alt'],
    derived: {
      'accent-alt-dark': (color) => shade(color, 0.12),
      'accent-alt-medium': (color) => tint(color, 0.6),
      'accent-alt-light': (color) => tint(color, 0.88),
      'secondary-foreground': (color) => contrastOn(color),
    },
  },
  {
    key: 'backgroundColor',
    tokens: ['background', 'dominant'],
    derived: {
      neutral: (color) => shade(color, 0.06),
      'neutral-light': (color) => shade(color, 0.02),
      'neutral-dark': (color) => shade(color, 0.08),
      card: (color) => shade(color, 0.06),
      'card-foreground': (color) => contrastOn(shade(color, 0.06)),
    },
  },
  {
    key: 'foregroundColor',
    tokens: ['foreground', 'complimentary', 'complimentary-core'],
    derived: {
      'complimentary-medium': (color) => tint(color, 0.05),
      'complimentary-light': (color) => tint(color, 0.11),
      line: (color) => tint(color, 0.6),
      disabled: (color) => tint(color, 0.57),
    },
  },
];

/**
 * Every colour token the compiled theme declares, grouped the way the editor
 * lists them. The four source colours above derive all of these, but each one
 * is also individually overridable in config — the old hardcoded theme.js let
 * an app set any of them by hand, and dropping those files must not take
 * options away.
 *
 * `derivedFrom` is the source field whose derivation an override replaces, and
 * is what the editor uses to offer "back to derived".
 */
const THEME_COLOR_TOKENS = [
  { token: 'accent', group: 'primary', derivedFrom: 'primaryColor' },
  { token: 'accent-core', group: 'primary', derivedFrom: 'primaryColor' },
  { token: 'accent-dark', group: 'primary', derivedFrom: 'primaryColor' },
  { token: 'accent-medium', group: 'primary', derivedFrom: 'primaryColor' },
  { token: 'accent-light', group: 'primary', derivedFrom: 'primaryColor' },
  { token: 'accent-foreground', group: 'primary', derivedFrom: 'primaryColor' },
  { token: 'accent-text', group: 'primary', derivedFrom: 'primaryColor' },
  { token: 'primary', group: 'primary', derivedFrom: 'primaryColor' },
  { token: 'primary-light', group: 'primary', derivedFrom: 'primaryColor' },
  {
    token: 'primary-foreground',
    group: 'primary',
    derivedFrom: 'primaryColor',
  },

  { token: 'secondary', group: 'secondary', derivedFrom: 'secondaryColor' },
  {
    token: 'secondary-foreground',
    group: 'secondary',
    derivedFrom: 'secondaryColor',
  },
  { token: 'accent-alt', group: 'secondary', derivedFrom: 'secondaryColor' },
  {
    token: 'accent-alt-dark',
    group: 'secondary',
    derivedFrom: 'secondaryColor',
  },
  {
    token: 'accent-alt-medium',
    group: 'secondary',
    derivedFrom: 'secondaryColor',
  },
  {
    token: 'accent-alt-light',
    group: 'secondary',
    derivedFrom: 'secondaryColor',
  },

  { token: 'background', group: 'surface', derivedFrom: 'backgroundColor' },
  { token: 'dominant', group: 'surface', derivedFrom: 'backgroundColor' },
  { token: 'neutral', group: 'surface', derivedFrom: 'backgroundColor' },
  { token: 'neutral-light', group: 'surface', derivedFrom: 'backgroundColor' },
  { token: 'neutral-dark', group: 'surface', derivedFrom: 'backgroundColor' },
  { token: 'card', group: 'surface', derivedFrom: 'backgroundColor' },
  {
    token: 'card-foreground',
    group: 'surface',
    derivedFrom: 'backgroundColor',
  },
  { token: 'background-dark', group: 'surface' },

  { token: 'foreground', group: 'text', derivedFrom: 'foregroundColor' },
  { token: 'complimentary', group: 'text', derivedFrom: 'foregroundColor' },
  {
    token: 'complimentary-core',
    group: 'text',
    derivedFrom: 'foregroundColor',
  },
  {
    token: 'complimentary-medium',
    group: 'text',
    derivedFrom: 'foregroundColor',
  },
  {
    token: 'complimentary-light',
    group: 'text',
    derivedFrom: 'foregroundColor',
  },
  { token: 'line', group: 'text', derivedFrom: 'foregroundColor' },
  { token: 'disabled', group: 'text', derivedFrom: 'foregroundColor' },
  { token: 'foreground-dark', group: 'text' },

  { token: 'success', group: 'system' },
  { token: 'error', group: 'system' },
  { token: 'failure', group: 'system' },
  { token: 'pending', group: 'system' },
  { token: 'neon-dark', group: 'system' },
];

const THEME_COLOR_GROUPS = ['primary', 'secondary', 'surface', 'text', 'system'];

/**
 * Font slots beyond the body/heading pair. The old per-app theme.js files set
 * these directly (lios had its own `accent` and `accent-alt` display faces), so
 * they stay individually settable.
 */
const THEME_FONT_SLOTS = ['serif', 'display', 'accent', 'accent-alt'];

const pascal = (part) => part.charAt(0).toUpperCase() + part.slice(1);

/** `accent-alt-light` → `colorAccentAltLight`, the config key for an override. */
function colorTokenConfigKey(token) {
  return `color${token.split('-').map(pascal).join('')}`;
}

/** `accent-alt` → `fontAccentAlt`, the config key for a font-slot override. */
function fontSlotConfigKey(slot) {
  return `font${slot.split('-').map(pascal).join('')}`;
}

/** A configured value if it is a usable hex, otherwise the neutral default. */
function colorOrDefault(theming, key) {
  const raw = (theming || {})[key];
  return isHexColor(raw) ? toHex(parseHex(raw)) : THEME_DEFAULTS[key];
}

/**
 * The complete `{ token: hex }` palette for a `theming` config — every token
 * the components reference, always fully populated. Unset or malformed fields
 * fall back to `THEME_DEFAULTS`, so there is no such thing as a half-built
 * palette and no app needs a hardcoded one of its own.
 */
function buildThemeColors(theming) {
  const colors = { ...SYSTEM_COLORS };

  for (const field of THEME_COLOR_FIELDS) {
    const color = colorOrDefault(theming, field.key);
    for (const token of field.tokens) {
      colors[token] = color;
    }
    for (const [token, derive] of Object.entries(field.derived || {})) {
      const derived = derive(color);
      if (derived) colors[token] = derived;
    }
  }

  // Derived here rather than in THEME_COLOR_FIELDS because it needs two of
  // the source colours: `.text-accent` maps to this token in the shared
  // stylesheet, so links and accented headings stay legible on the configured
  // background whatever the admin picks as their fill colour.
  colors['accent-text'] = readableOn(colors.accent, colors.background);

  // An explicit per-token override wins over whatever was derived for it.
  for (const { token } of THEME_COLOR_TOKENS) {
    const override = (theming || {})[colorTokenConfigKey(token)];
    if (isHexColor(override)) {
      colors[token] = toHex(parseHex(override));
    }
  }

  return colors;
}

/**
 * The `fontFamily` map for a `theming` config. With no font configured this is
 * the neutral system stack rather than a downloaded face, so a default install
 * makes no external font request at all.
 *
 * `accent` and `display` follow the heading font: both are used for the
 * emphatic, uppercase treatments (nav CTAs, hero headings) that a heading face
 * is picked for.
 */
function buildThemeFonts(theming) {
  const value = theming || {};
  const body = resolveFontStack(value.fontFamilyBody) || SANS_FALLBACKS;
  const heading = resolveFontStack(value.fontFamilyHeading) || body;

  const fonts = {
    sans: body,
    body,
    serif: resolveFontStack(value.fontFamilyHeading)
      ? heading
      : SERIF_FALLBACKS,
    display: heading,
    accent: heading,
    'accent-alt': heading,
  };

  // Per-slot overrides, so a community can keep a distinct display face
  // without changing what everything else inherits.
  for (const slot of THEME_FONT_SLOTS) {
    const stack = resolveFontStack(value[fontSlotConfigKey(slot)]);
    if (stack) fonts[slot] = stack;
  }

  return fonts;
}

/**
 * Structural theme values that are not anybody's brand — shadows and the
 * animations the components declare. Kept here so `theme.js` holds no literals
 * of its own.
 */
const BASE_THEME_EXTEND = {
  boxShadow: {
    xl: '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.2)',
    '4xl':
      '0px 1px 5px rgba(0, 0, 0, 0.12), 0px 2px 2px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.2);',
  },
  keyframes: {
    'sparkle-float': {
      '0%': { opacity: '0', transform: 'translateY(0)' },
      '25%': { opacity: '1', transform: 'translateY(-4px)' },
      '75%': { opacity: '0.6', transform: 'translateY(-10px)' },
      '100%': { opacity: '0', transform: 'translateY(-14px)' },
    },
    'fade-in': {
      '0%': { opacity: '0', transform: 'translateX(-50%) translateY(4px)' },
      '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
    },
  },
  animation: {
    'sparkle-float': 'sparkle-float 2.2s ease-in-out infinite',
    'fade-in': 'fade-in 0.3s ease-out forwards',
  },
};

/**
 * The whole Tailwind theme for a `theming` config. This is the only place a
 * palette is assembled — `theme.js` just feeds it the build-time snapshot, and
 * every app consumes the result unchanged.
 */
function buildTheme(theming) {
  const colors = buildThemeColors(theming);

  return {
    extend: {
      ...BASE_THEME_EXTEND,
      colors,
      // The one utility that must not take the fill colour: `text-accent` is
      // links and accented headings, which have to stay legible on the page
      // even when the brand colour is pale (see `accent-text`). Tailwind reads
      // `textColor` for `text-*` only, so fills, borders and rings still get
      // the accent itself, and every `text-*` variant - hover, group-hover -
      // follows this scale automatically.
      textColor: { ...colors, accent: colors['accent-text'] },
      fontFamily: buildThemeFonts(theming),
    },
    plugins: [],
  };
}

/** Read the `theming` bucket out of a build-time config snapshot. */
function getThemingFromSnapshot(snapshot) {
  const theming = snapshot && snapshot.theming;
  if (theming == null || typeof theming !== 'object' || Array.isArray(theming)) {
    return {};
  }
  return theming;
}

module.exports = {
  BASE_THEME_EXTEND,
  THEME_COLOR_GROUPS,
  THEME_COLOR_TOKENS,
  THEME_FONT_SLOTS,
  colorTokenConfigKey,
  fontSlotConfigKey,
  SYSTEM_COLORS,
  THEME_COLOR_FIELDS,
  THEME_DEFAULTS,
  THEME_FONTS,
  buildTheme,
  buildThemeColors,
  buildThemeFonts,
  contrastOn,
  contrastRatio,
  getGoogleFontsUrl,
  getThemingFromSnapshot,
  isHexColor,
  mix,
  readableOn,
  resolveFontStack,
  shade,
  tint,
};
