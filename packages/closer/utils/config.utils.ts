import { configDescription } from '../config';
import { Config } from '../types';

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
        ?.enabled?.default ?? true;
    const isEnabled = (!isConfigDefined && isDefaultEnabled) || isConfigEnabled;

    return isEnabled;
  });
  return enabledConfigs;
};

export const getPreparedInputValue = (value: string) => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (!isNaN(Number(value))) {
    return Number(value);
  }
  return String(value);
};

export const prepareConfigs = (
  myConfigs: Config[],
  configDescriptions: any,
) => {
  const configsOutput = [];

  for (const categoryDefaultConfig of configDescriptions) {
    const categoryName = categoryDefaultConfig.slug;
    let configOutput = {} as Record<string, any>;
    const categoryMyConfig: any = myConfigs.find(
      (config) => config.slug === categoryName,
    )?.value;

    for (const key in categoryDefaultConfig.value) {
      const defaultConfigData = categoryDefaultConfig.value[key].type;
      const isArray = Array.isArray(defaultConfigData);
      if (isArray) {
        const defaultNestedConfig = categoryDefaultConfig.value[key].default[0];
        const configArray = categoryMyConfig && categoryMyConfig[key];

        const output: any[] = [];

        if (!configArray) {
          const plan = { ...defaultNestedConfig };
          output.push(plan);
        }
        configArray?.forEach((myConfigElement: any) => {
          const plan = { ...defaultNestedConfig };
          Object.entries(defaultNestedConfig).forEach(([nestedKey]) => {
            if (myConfigElement.hasOwnProperty(nestedKey)) {
              plan[nestedKey] = myConfigElement[nestedKey];
            } else {
              plan[nestedKey] = defaultNestedConfig[nestedKey];
            }
          });
          output.push(plan);
        });

        configOutput = {
          ...configOutput,
          [key]: output,
        };
      } else {
        configOutput[key] =
          categoryMyConfig?.[key] !== undefined
            ? categoryMyConfig?.[key]
            : categoryDefaultConfig.value[key].default;
      }
    }

    configsOutput.push({
      slug: categoryDefaultConfig.slug,
      value: configOutput,
    });
  }
  return configsOutput;
};

export const getUpdatedArray = (
  value: any,
  index: null | number = null,
  name: string,
  inputValue: string | number | boolean,
) => {
  if (typeof inputValue === 'boolean') {
    name = name.substring(0, name.length - 1);
  }
  const updatedArray = value.map((item: any[], idx: number) =>
    idx === index ? { ...item, [name as string]: inputValue } : item,
  );
  return updatedArray;
};