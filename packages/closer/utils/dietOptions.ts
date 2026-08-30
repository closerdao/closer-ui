import { BookingConfig, VolunteerConfig } from '../types/api';
import { getCachedConfig } from './cachedConfig.helpers';

/**
 * Dietary preference is a single choice, edited by admins under Booking config.
 *
 * It used to live under Volunteering, so a platform that customised the list
 * there still has it stored under that slug — that value is read as a fallback
 * rather than being silently replaced by the new defaults.
 */
export const DEFAULT_DIET_OPTIONS = [
  'No restrictions',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-free',
  'Dairy-free',
  'Nut allergy',
  'Halal',
  'Kosher',
  'Other',
];

const splitOptions = (value?: string) =>
  (value || '')
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);

/** The configured choices, as the shape the Dropdown takes. */
export const getDietOptions = (): { label: string; value: string }[] => {
  const fromBooking = splitOptions(
    (getCachedConfig('booking') as BookingConfig | null)?.diet,
  );
  const fromVolunteering = splitOptions(
    (getCachedConfig('volunteering') as VolunteerConfig | null)?.diet,
  );
  const options = fromBooking.length
    ? fromBooking
    : fromVolunteering.length
    ? fromVolunteering
    : DEFAULT_DIET_OPTIONS;

  return options.map((option) => ({ label: option, value: option }));
};

/**
 * Existing profiles hold a list, from when this was a multi-select. Read the
 * first entry so the dropdown opens on something the person actually chose.
 */
export const toSingleDiet = (value?: string | string[] | null): string => {
  if (Array.isArray(value)) return value[0] || '';
  if (!value) return '';
  return value.split(',')[0]?.trim() || '';
};
