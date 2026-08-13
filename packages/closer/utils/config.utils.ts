import { configDescription } from '../config';
import { Config } from '../types';

export const getReserveTokenDisplay = (config: any): string =>
  config?.token?.reserveToken ?? config?.web3?.reserveToken ?? 'cEUR';

export const getGasTokenDisplay = (config: any): string =>
  config?.token?.gasToken ?? config?.web3?.gasToken ?? 'CELO';

export const getEnabledConfigs = (configs: any, allConfigs: string[]) => {
  const enabledConfigs = allConfigs.filter((configName) => {
    const isConfigDefined = configs.some((config: any) => {
      return config.slug === configName;
    });
    const isConfigEnabled = configs.some((config: any) => {
      return config.slug === configName && config.value?.enabled;
    });
    const isDefaultEnabled =
      configDescription.find((config) => config.slug === configName)?.value
        ?.enabled?.default ?? false;
    const isEnabled = (!isConfigDefined && isDefaultEnabled) || isConfigEnabled;

    return isEnabled;
  });
  return enabledConfigs;
};

/**
 * Describes the `elements` arrays across configs so the config form can build
 * per-index validation rules (`price-0`, `price-1`, …).
 *
 * Stored configs can hold an `elements` key that is an empty array, or that
 * holds non-object entries, once an admin removes every element. `[]` is
 * truthy, so a naive truthiness filter lets it through and `elements[0]` is
 * `undefined` — reading keys off that throws during render and takes the whole
 * config page down. Skip anything that cannot describe a shape.
 */
export const getArrayConfigsSchema = (
  configs: { value?: Record<string, any> }[],
): { len: number; names: string[] }[] =>
  (configs || []).flatMap((config) => {
    const elements = config?.value?.elements;
    if (!Array.isArray(elements)) {
      return [];
    }
    const firstElement = elements[0];
    if (!firstElement || typeof firstElement !== 'object') {
      return [];
    }
    return [{ len: elements.length, names: Object.keys(firstElement) }];
  });

export const getPreparedInputValue = (value: string) => {
  if (value === '') {
    return '';
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  // Handle JSON arrays (for multiselect values)
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

/**
 * The `token` config was called `web3`, and the financed-purchase terms
 * (`downPaymentPercent`, `tokenPriceModifierPercent`) used to live on
 * `citizenship`. Stored config documents still carry the old slugs, so read
 * through to them: anything explicitly set on a `token` document still wins.
 *
 * Returns the values a `token` document should be layered on top of.
 */
export const getLegacyTokenConfigValue = (
  apiBySlug: Record<string, Record<string, any>>,
): Record<string, any> => {
  const legacyCitizenship = apiBySlug['citizenship'];

  const inherited: Record<string, any> = { ...(apiBySlug['web3'] || {}) };
  ['downPaymentPercent', 'tokenPriceModifierPercent'].forEach((key) => {
    if (legacyCitizenship && key in legacyCitizenship) {
      inherited[key] = legacyCitizenship[key];
    }
  });

  return inherited;
};

export const buildMergedConfig = (
  apiConfigs: Array<{ slug: string; value?: Record<string, any> }>,
): Record<string, Record<string, any>> => {
  const apiBySlug: Record<string, Record<string, any>> = {};
  (apiConfigs || []).forEach((c) => {
    apiBySlug[c.slug] = c.value || {};
  });
  const legacyToken = getLegacyTokenConfigValue(apiBySlug);
  const result: Record<string, Record<string, any>> = {};
  configDescription.forEach((desc) => {
    const slug = desc.slug;
    const defaults = getDefaultConfigValue(slug, configDescription);
    result[slug] = Object.assign(
      {},
      defaults,
      slug === 'token' ? legacyToken : {},
      apiBySlug[slug] || {},
    );
  });
  Object.keys(apiBySlug).forEach((slug) => {
    if (!result[slug]) result[slug] = apiBySlug[slug];
  });

  const rawPayment = apiBySlug['payment'] ?? {};
  const mergedBooking = result['booking'];
  if (
    result.payment &&
    mergedBooking?.utilityFiatCur &&
    !('fiatCur' in rawPayment) &&
    !('utilityFiatCur' in rawPayment)
  ) {
    const cur = String(mergedBooking.utilityFiatCur);
    result.payment = { ...result.payment, fiatCur: cur, utilityFiatCur: cur };
  }

  return result;
};

export function mergePaymentValueWithBookingCurrencyFallback(
  payment: Record<string, unknown> | null | undefined,
  booking: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!payment) {
    return payment === null ? null : undefined;
  }
  if (
    Object.prototype.hasOwnProperty.call(payment, 'fiatCur') ||
    Object.prototype.hasOwnProperty.call(payment, 'utilityFiatCur')
  ) {
    return payment;
  }
  const cur = booking?.utilityFiatCur;
  if (cur == null || cur === '') {
    return payment;
  }
  const curStr = String(cur);
  return { ...payment, fiatCur: curStr, utilityFiatCur: curStr };
}

export const getDefaultConfigValue = (
  slug: string,
  configDescriptions: any[],
): Record<string, any> => {
  const categoryDefaultConfig = configDescriptions.find(
    (c: any) => c?.slug === slug,
  );
  if (!categoryDefaultConfig?.value) return {};
  const configOutput: Record<string, any> = {};
  for (const key in categoryDefaultConfig.value) {
    const def = categoryDefaultConfig.value[key];
    const defaultConfigData = def.type;
    const isArray = Array.isArray(defaultConfigData);
    if (isArray) {
      const defaultArray = def.default;
      const isPrimitiveArray =
        defaultConfigData.length === 1 &&
        (defaultConfigData[0] === 'text' ||
          defaultConfigData[0] === 'number' ||
          defaultConfigData[0] === 'boolean');
      if (isPrimitiveArray) {
        configOutput[key] = Array.isArray(defaultArray) ? [...defaultArray] : [];
      } else {
        configOutput[key] = Array.isArray(defaultArray)
          ? defaultArray.map((el: any) =>
              typeof el === 'object' && el !== null ? { ...el } : el,
            )
          : [];
      }
    } else {
      configOutput[key] = def.default;
    }
  }
  return configOutput;
};

export const prepareConfigs = (
  myConfigs: Config[],
  configDescriptions: any,
): Array<{ slug: string; value: Record<string, any> }> => {
  const apiBySlug: Record<string, Record<string, any>> = {};
  (myConfigs || []).forEach((c) => {
    apiBySlug[c.slug] = (c.value as Record<string, any>) || {};
  });
  const legacyToken = getLegacyTokenConfigValue(apiBySlug);

  return configDescriptions.map((desc: any) => {
    const slug = desc.slug;
    const defaults = getDefaultConfigValue(slug, configDescriptions);
    const apiValue = apiBySlug[slug] || {};
    return {
      slug,
      value: Object.assign(
        {},
        defaults,
        slug === 'token' ? legacyToken : {},
        apiValue,
      ),
    };
  });
};

export const getUpdatedArray = (
  value: any,
  index: null | number = null,
  name: string,
  inputValue: string | number | boolean,
) => {
  // Strip the index from the name if it exists at the end
  const strippedName = name.replace(/\d+$/, '');

  const updatedArray = value.map((item: any[], idx: number) =>
    idx === index ? { ...item, [strippedName]: inputValue } : item,
  );
  return updatedArray;
};
