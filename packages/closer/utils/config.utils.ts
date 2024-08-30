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
  if (value === '') {
    return '';
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return String(value);
};

export const prepareConfigs = (
  myConfigs: Config[],
  configDescriptions: any,
) => {
  const configsOutput = [];

  for (const categoryDefaultConfig of configDescriptions) {
    const categoryName = categoryDefaultConfig?.slug;
    let configOutput = {} as Record<string, any>;
    const categoryMyConfig: any = myConfigs.find(
      (config) => config.slug === categoryName,
    )?.value;

    for (const key in categoryDefaultConfig?.value) {
      const defaultConfigData = categoryDefaultConfig.value[key].type;
      const isArray = Array.isArray(defaultConfigData);
      if (isArray) {
        let defaultNestedConfig = categoryDefaultConfig.value[key].default[0];

        const configArray = categoryMyConfig && categoryMyConfig[key];
        const output: any[] = [];

        if (categoryName === 'emails') {
          // if new template is added to defaults, show it in the UI
          const defaultNestedArrayConfig =
            categoryDefaultConfig.value[key].default;

          defaultNestedArrayConfig.forEach((element: any, index: number) => {
            defaultNestedConfig =
              categoryDefaultConfig.value[key].default[index];
            const doesIncludeTemplate = configArray?.some(
              (config: any) => config.name === element.name,
            );
            // check if there are elements that exist in db array but not in default array
            if (!doesIncludeTemplate) {
              configArray?.push(element);
            }
          });
        }

        if (!configArray) {
          if (categoryName === 'emails') {
            output.push(...categoryDefaultConfig.value[key].default);
          } else {
            output.push(defaultNestedConfig);
          }
        }

        configArray?.forEach((myConfigElement: any) => {
          const entry = { ...defaultNestedConfig };
          Object.entries(defaultNestedConfig).forEach(([nestedKey]) => {
            if (myConfigElement.hasOwnProperty(nestedKey)) {
              entry[nestedKey] = myConfigElement[nestedKey];
            } else {
              entry[nestedKey] = defaultNestedConfig[nestedKey];
            }
          });
          output.push(entry);
        });

        configOutput = {
          ...configOutput,
          [key]: output,
        };
      } else {
        if (!categoryMyConfig && key === 'enabled') {
          configOutput[key] = false;
        } else {
          configOutput[key] =
            categoryMyConfig?.[key] !== undefined
              ? categoryMyConfig?.[key]
              : categoryDefaultConfig.value[key].default;
        }
      }
    }

    configsOutput.push({
      slug: categoryDefaultConfig?.slug,
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
  if (typeof inputValue === 'boolean' && index) {
    name = name.substring(0, name.length - index?.toString().length);
  }
  const updatedArray = value.map((item: any[], idx: number) =>
    idx === index ? { ...item, [name as string]: inputValue } : item,
  );
  return updatedArray;
};
