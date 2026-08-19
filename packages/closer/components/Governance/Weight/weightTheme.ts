// Presence/Sweat/staked/alarm are this page's own semantic colors (token
// identity, "gap" state) rather than TDF brand chrome, so they live here
// instead of the shared Tailwind theme. Everything else on this page uses
// the app's existing design tokens (accent, gray scale, etc.) directly as
// Tailwind classes.
export const WEIGHT_COLORS = {
  presence: '#4E7F6E',
  sweat: '#B79A18',
  staked: '#6E4E9E',
  alarm: '#DC2626',
} as const;

// "Earth & Sky" ramp: six shades of River Blue (dark navy -> pale sky), then
// six shades of Autumn Shimmer (rust -> pale peach). Two clearly different hue
// families read apart at a glance for the rank jump at #6/#7, and the
// lightness step within each family still orders rank 1-6 and 7-12 legibly.
export const CONCENTRATION_SLICE_COLORS = [
  '#1C324A',
  '#294A6C',
  '#35618E',
  '#4278B1',
  '#5F90C3',
  '#81A7D0',
  '#AF491D',
  '#D35823',
  '#DF7142',
  '#E68D67',
  '#ECA88C',
  '#F2C4B0',
];
export const CONCENTRATION_REST_COLOR = '#DCD5C8';

// River Blue for TDF, Autumn Shimmer for Sweat — Presence keeps its own
// established green, which sits clearly apart from both on the wheel.
export const COMPOSITION_COLORS = {
  tdf: '#366290',
  presence: WEIGHT_COLORS.presence,
  sweat: '#E27D52',
};
