import { configDescription } from '../config';
import { getDefaultConfigValue } from './config.utils';

interface InputObject {
  [key: string]: {
    label: string;
    value: string | number;
  };
}

export function mergeGeneralConfigWithDefaults(
  apiValue: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const defaults = getDefaultConfigValue('general', configDescription);
  if (!apiValue || typeof apiValue !== 'object') return defaults;
  return Object.assign({}, defaults, apiValue);
}

export function prepareGeneralConfig(
  inputObj: InputObject | any,
): Record<string, string> | null {
  if (!inputObj) return null;

  const result: Record<string, string> = {};

  Object.entries(inputObj).forEach(([key, value]) => {
    const words = key.split(/(?=[A-Z])/).map((word) => word.toUpperCase());
    const upperCaseKey = words.join('_');
    result[upperCaseKey] = String(value);
  });

  return result;
}

export function twitterUrlToHandle(url: string | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/(?:twitter\.com|x\.com)\/([^/?]+)/i);
  return match ? `@${match[1]}` : '';
}
