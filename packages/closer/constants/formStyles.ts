/**
 * The one field look, shared by every form in the app.
 *
 * `FormField` (the renderer behind EditModel — platform settings, event
 * creation, project creation) and the `ui` primitives used by hand-built forms
 * such as /settings used to carry their own copies of these classes, so the
 * same form control looked different depending on which screen you opened it
 * on. Both now read from here, and a screen that needs a variation passes a
 * `className` over the top rather than restating the base.
 */

/**
 * Label above a field. Dark enough to read at this size — the earlier gray-400
 * was legible as a decoration but not as text.
 */
export const FIELD_LABEL_CLASS =
  'block text-[11px] uppercase tracking-[0.12em] text-gray-600 font-semibold';

/**
 * Text input, textarea, and anything else that takes typing.
 *
 * Focus is the ring alone: recolouring the 1px border under a 3px ring only
 * made the edge look muddy.
 */
export const FIELD_CONTROL_CLASS =
  'new-input w-full rounded-xl border border-gray-300 !bg-white px-3.5 py-2.5 text-[15px] leading-snug text-gray-900 placeholder:text-gray-400 outline-none transition-shadow focus:ring-[3px] focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Native <select>. `appearance-none` removes the platform arrow, so the caret
 * is drawn as a background image — sized in both axes, because a single length
 * leaves the height `auto` and an SVG with only a viewBox then stretches to
 * fill the field.
 */
export const FIELD_SELECT_CLASS =
  'new-input w-full rounded-xl border border-gray-300 !bg-white px-3.5 py-2.5 text-[15px] leading-snug text-gray-900 outline-none transition-shadow focus:ring-[3px] focus:ring-accent/30 appearance-none bg-[length:16px_16px] bg-[right_14px_center] bg-no-repeat pr-10';

/** The caret drawn on `FIELD_SELECT_CLASS`, as an inline background image. */
export const FIELD_SELECT_CARET_STYLE = {
  // The SVG's own quotes are percent-encoded so the whole data URI fits in a
  // single-quoted string.
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%236b7280%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27%3E%3C/path%3E%3C/svg%3E")',
};

/** A field in an error state. */
export const FIELD_INVALID_CLASS = '!border-error';

/**
 * The react-widgets pickers (Dropdown, MultiSelect) paint their own box, and
 * their stylesheet is imported after Tailwind's utilities layer — so no utility
 * class can restyle it. Their half of this look lives in css/forms.css, under
 * selectors specific enough to outrank react-widgets; this class is only the
 * layout the container still needs.
 */
export const FIELD_PICKER_CLASS = 'w-full';
