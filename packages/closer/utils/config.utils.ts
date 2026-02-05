import { configDescription } from '../config';
import { Config } from '../types';

export const getReserveTokenDisplay = (config: any): string =>
  config?.web3?.reserveToken ?? 'cEUR';

export const getGasTokenDisplay = (config: any): string =>
  config?.web3?.gasToken ?? 'CELO';

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
        const defaultArray = categoryDefaultConfig.value[key].default;
        const isPrimitiveArray = defaultConfigData.length === 1 && 
          (defaultConfigData[0] === 'text' || defaultConfigData[0] === 'number' || defaultConfigData[0] === 'boolean');
        
        let defaultNestedConfig: any = null;
        
        if (Array.isArray(defaultArray) && defaultArray.length > 0) {
          defaultNestedConfig = defaultArray[0];
        } else if (Array.isArray(defaultConfigData) && defaultConfigData.length > 0 && !isPrimitiveArray) {
          const typeDefinition = defaultConfigData[0];
          if (typeDefinition && typeof typeDefinition === 'object') {
            defaultNestedConfig = {};
            Object.keys(typeDefinition).forEach((typeKey) => {
              const typeValue = typeDefinition[typeKey];
              if (typeValue === 'text') {
                defaultNestedConfig[typeKey] = '';
              } else if (typeValue === 'number') {
                defaultNestedConfig[typeKey] = 0;
              } else if (typeValue === 'boolean') {
                defaultNestedConfig[typeKey] = false;
              }
            });
          }
        }

        const configArray = categoryMyConfig && categoryMyConfig[key];
        const output: any[] = [];

        if (categoryName === 'emails') {
          // if new template is added to defaults, show it in the UI
          const defaultNestedArrayConfig =
            categoryDefaultConfig.value[key].default;

          defaultNestedArrayConfig.forEach((element: any, index: number) => {
            const templateConfig =
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
          } else if (defaultNestedConfig) {
            output.push(defaultNestedConfig);
          }
        }

        if (isPrimitiveArray) {
          // For primitive arrays (like ['text']), just use the array as-is
          output.push(...(configArray || []));
        } else {
          configArray?.forEach((myConfigElement: any) => {
            if (!defaultNestedConfig) {
              // If no default config, just use the element as-is
              output.push(myConfigElement || {});
              return;
            }
            const entry = { ...defaultNestedConfig };
            if (defaultNestedConfig && typeof defaultNestedConfig === 'object') {
              Object.entries(defaultNestedConfig).forEach(([nestedKey]) => {
                if (myConfigElement && myConfigElement.hasOwnProperty(nestedKey)) {
                  entry[nestedKey] = myConfigElement[nestedKey];
                } else {
                  entry[nestedKey] = defaultNestedConfig[nestedKey];
                }
              });
            }
            output.push(entry);
          });
        }

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
  // Strip the index from the name if it exists at the end
  const strippedName = name.replace(/\d+$/, '');

  const updatedArray = value.map((item: any[], idx: number) =>
    idx === index ? { ...item, [strippedName]: inputValue } : item,
  );
  return updatedArray;
};
