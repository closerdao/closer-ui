/**
 * Normalizes isFriendsBooking value from string or boolean to boolean
 * @param value - The value to normalize (can be string 'true'/'false', string array, or boolean)
 * @returns boolean - The normalized boolean value
 */
export const normalizeIsFriendsBooking = (
  value: string | string[] | boolean | undefined,
): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0].toLowerCase() === 'true';
  }

  return false;
};

/**
 * Converts isFriendsBooking to string for URL parameters
 * @param value - The boolean value to convert
 * @returns string - The string representation ('true' or 'false')
 */
export const isFriendsBookingToString = (
  value: boolean | undefined,
): string => {
  return value ? 'true' : 'false';
};
