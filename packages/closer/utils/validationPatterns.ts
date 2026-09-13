/**
 * The field patterns, in one place.
 *
 * The `Input` component and `isInputValid` used to carry their own copies, and
 * they disagreed: a Danish number like +4522329888 passed one and failed the
 * other, so a form would refuse a number the API had already accepted.
 */

export const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Phone numbers are only grouped into 3-3-4 in North America. Accept an
 * optional country prefix followed by digits and the usual printed separators,
 * and judge length by digit count alone — 5 to 15, the range from the shortest
 * national numbers to the E.164 ceiling.
 */
export const PHONE_PATTERN =
  /^(?=(?:\D*\d){5,15}\D*$)\+?[0-9][0-9().\-\s]*$/;

/**
 * Tax / VAT identifiers are not digits-only outside a handful of countries:
 * they carry a country prefix (PT516493388), letters in the body
 * (NL000002319B42), and printed separators (CHE-383.711.471). Accept any
 * mixture of letters, digits and the usual separators, and only insist that the
 * identifier holds between 5 and 20 alphanumeric characters — the range that
 * spans every national format we have seen. The field is optional, so an empty
 * value is valid.
 */
export const TAX_NO_PATTERN =
  /^$|^(?=(?:[^0-9A-Za-z]*[0-9A-Za-z]){5,20}[^0-9A-Za-z]*$)[0-9A-Za-z][0-9A-Za-z .()/-]*$/;
