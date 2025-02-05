import Head from 'next/head';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import ArrayConfig from '../../components/ArrayConfig';
import PlatformFeatureSelector from '../../components/PlatformConfig/PlatformFeatureSelector';
import {
  Button,
  Card,
  ErrorMessage,
  Heading,
  Information,
} from '../../components/ui';
import Switcher from '../../components/ui/Switcher';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { configDescription } from '../../config';
import { getValidationSchema } from '../../constants/validation.constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { Config } from '../../types';
import { ConfigType } from '../../types/config';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import {
  getEnabledConfigs,
  getPreparedInputValue,
  getUpdatedArray,
  prepareConfigs,
} from '../../utils/config.utils';
import { capitalizeFirstLetter } from '../../utils/learn.helpers';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';
import AdminLayout from '../../components/Dashboard/AdminLayout';

interface Props {
  defaultEmailsConfig: ConfigType;
  error: null | string;
}

const ConfigPage = ({ defaultEmailsConfig, error }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { platformAllowedConfigs } = useConfig() || {};
  const { user } = useAuth();

  const myConfigs = platform.config.find();

  const filter = {};
  const mergedConfigDescription = configDescription.concat(defaultEmailsConfig);

  const allConfigCategories = mergedConfigDescription
    .map((config: any) => config?.slug)
    .filter((config: any) => platformAllowedConfigs?.includes(config));

  const [selectedConfig, setSelectedConfig] = useState('general');
  const [updatedConfigs, setUpdatedConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfigUpdated, setHasConfigUpdated] = useState(false);
  const [enabledConfigs, setEnabledConfigs] = useState<string[]>([]);
  const [isGeneralConfigEnabled, setIsGeneralConfigEnabled] = useState(false);
  const [errors, setErrors] = useState<{
    [key: string]: string | null | undefined | any;
  }>({});

  const currentConfig = useMemo(
    () => updatedConfigs.find((config) => config.slug === selectedConfig),
    [updatedConfigs, selectedConfig],
  );

  const arrayConfigsSchema =
    updatedConfigs
      .filter((config) => config.value.elements)
      .map((config) => {
        if (!Array.isArray(config.value.elements)) {
          return;
        }
        const elements = config.value.elements;
        return { len: elements.length, names: Object.keys(elements[0]) };
      }) || [];

  const configFormSchema = getValidationSchema(arrayConfigsSchema as any);

  useEffect(() => {
    loadData();
  }, [platform, filter]);

  useEffect(() => {
    if (myConfigs) {
      const preparedConfigs = prepareConfigs(
        myConfigs.toJS(),
        mergedConfigDescription,
      );

      const enabledConfigs = getEnabledConfigs(
        preparedConfigs,
        allConfigCategories,
      );

      if (enabledConfigs.includes('general')) {
        setIsGeneralConfigEnabled(true);
      } else {
        setIsGeneralConfigEnabled(false);
      }

      setUpdatedConfigs(preparedConfigs);
      setEnabledConfigs(enabledConfigs);
    }
  }, [myConfigs]);

  const loadData = async () => {
    try {
      platform.config.get();
    } catch (err) {
      console.log('Load error', err);
    }
  };

  const saveInitialConfig = async () => {
    const initialConfigCategories = ['general', 'emails'];
    const newConfigs: Config[] = [
      ...updatedConfigs.map((config) => {
        if (initialConfigCategories.includes(config.slug)) {
          return {
            ...config,
            value: { ...config.value, enabled: true },
          };
        }
        return config;
      }),
    ];
    setUpdatedConfigs(newConfigs);
    await Promise.all(
      initialConfigCategories.map((configCategory) =>
        handleSaveConfig(newConfigs, configCategory),
      ),
    );
    await loadData();
    setEnabledConfigs([...enabledConfigs, ...initialConfigCategories]);
    setIsGeneralConfigEnabled(true);
  };

  const handleToggleConfig = (configCategory: string) => {
    let shouldEnable = false;
    if (enabledConfigs && enabledConfigs?.includes(configCategory)) {
      setEnabledConfigs(
        enabledConfigs?.filter((item: string) => item !== configCategory),
      );
      setSelectedConfig('general');
      shouldEnable = false;
    } else {
      setSelectedConfig(configCategory);
      setEnabledConfigs([...enabledConfigs, configCategory]);
      shouldEnable = true;
    }

    const newConfigs: Config[] = [
      ...updatedConfigs.map((config) => {
        if (config.slug === configCategory) {
          return {
            ...config,
            value: { ...config.value, enabled: shouldEnable },
          };
        }
        return config;
      }),
    ];

    setUpdatedConfigs(newConfigs);
    handleSaveConfig(newConfigs, configCategory);
  };

  const handleSaveConfig = async (
    newConfigs: Config[] = [],
    configCategory = '',
  ) => {
    const configCategoryToSave = configCategory || selectedConfig;
    const configsToSave = newConfigs.length > 0 ? newConfigs : updatedConfigs;

    const updatedConfig = configsToSave.find(
      (config) => config.slug === configCategoryToSave,
    );

    try {
      setIsLoading(true);
      const configExists = myConfigs
        .toJS()
        .some((config: any) => config.slug === configCategoryToSave);

      let res;
      if (configExists) {
        res = await api.patch(`/config/${configCategoryToSave}`, {
          slug: configCategoryToSave,
          value: updatedConfig?.value,
        });
      } else {
        res = await api.post('/config', {
          slug: configCategoryToSave,
          value: updatedConfig?.value,
        });
      }

      setHasConfigUpdated(false);
      if (res.status === 200) {
        setHasConfigUpdated(true);
        setTimeout(() => {
          setHasConfigUpdated(false);
        }, 3000);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >,
    key = '',
    index: null | number = null,
  ) => {
    const { value: inputValue } = event.target;
    const { name } = event.target;

    const validationResult = configFormSchema?.safeParse({
      [name]: inputValue,
    });

    if (validationResult?.success) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    } else {
      const fieldErrors: Record<string, string[] | undefined> | undefined =
        validationResult?.error.flatten().fieldErrors;
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: fieldErrors?.[name]?.[0] || null,
      }));
    }
    const strippedName = name.replace(/-?\d+$/, '');

    const newConfigs = [
      ...updatedConfigs.map((config) => {
        if (config.slug === selectedConfig) {
          let valueToUpdate: any = inputValue;
          const isArray = key && index !== null;

          const preparedInputValue = getPreparedInputValue(inputValue);

          if (isArray) {
            valueToUpdate = config.value[key];
            const updatedArray = getUpdatedArray(
              valueToUpdate,
              index,
              strippedName,
              preparedInputValue,
            );
            return {
              ...config,
              value: { ...config.value, [key]: updatedArray },
            };
          }

          return {
            ...config,
            value: { ...config.value, [strippedName]: preparedInputValue },
          };
        }
        return config;
      }),
    ];
    setUpdatedConfigs(newConfigs);
  };

  const resetToDefault = (name: string) => {
    const newConfigs = [
      ...updatedConfigs.map((config) => {
        if (config.slug === selectedConfig) {
          const defaultConfig = mergedConfigDescription.find(
            (config: any) => config.slug === selectedConfig,
          );
          const defaultValue = defaultConfig?.value?.elements?.default.find(
            (element: any) => element.name === name,
          );
          const elements: any = config.value.elements;

          const updatedElements = elements.map((element: any) => {
            if (element.name === name) {
              return defaultValue;
            }
            return element;
          });
          return {
            ...config,
            value: { ...config.value, elements: updatedElements },
          };
        }
        return config;
      }),
    ];
    setUpdatedConfigs(newConfigs);
  };

  const handleAddElement = () => {
    const defaultConfig = mergedConfigDescription as any;
    const defaultPlan = defaultConfig.find(
      (config: any) => config.slug === selectedConfig,
    ).value.elements.default;

    const newConfigs = [
      ...updatedConfigs.map((config) => {
        if (config.slug === selectedConfig) {
          const elements: any = config.value.elements;
          const newElements = [...elements, ...defaultPlan];
          return {
            ...config,
            value: { ...config.value, elements: newElements },
          };
        }
        return config;
      }),
    ];
    setUpdatedConfigs(newConfigs);
  };

  const handleDeleteElement = (index: number) => {
    const newConfigs = [
      ...updatedConfigs.map((config) => {
        if (config.slug === selectedConfig) {
          const elements: any = config.value.elements;
          const updatedElements = elements.filter(
            (_: any, idx: number) => idx !== index,
          );
          return {
            ...config,
            value: { ...config.value, elements: updatedElements },
          };
        }
        return config;
      }),
    ];
    setUpdatedConfigs(newConfigs);
  };

  if (!user || !user.roles?.includes('admin')) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <div>
      <Head>
        <title>{t('platform_configs')}</title>
      </Head>

      <AdminLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <Heading level={1}>{t('platform_configs')}</Heading>

       {allConfigCategories.length > 1 && isGeneralConfigEnabled && (
          <PlatformFeatureSelector
            enabledConfigs={enabledConfigs}
            allConfigCategories={allConfigCategories}
            handleToggleConfig={handleToggleConfig}
          />
        )}

       {!isGeneralConfigEnabled && (
          <Card className="flex flex-col gap-4">
            <Heading level={4}>
              {t('platform_configs_initial_settings')}
            </Heading>

           {(updatedConfigs.find((config) => config.slug === 'general')
              ?.value ??
              []) &&
              Object.entries(
                updatedConfigs.find((config) => config.slug === 'general')
                  ?.value ?? {},
              ).map(([key, value]) => {
                const currentValue: string | number | boolean | any[] =
                  updatedConfigs.find(
                    (config) => config.slug === selectedConfig,
                  )?.value[key] ?? [];
                const description = mergedConfigDescription?.find(
                  (c) => c.slug === 'general',
                )?.value as Record<string, any>;
                const inputType = description?.[key]?.type;
                const isSelect = inputType === 'select';
                const selectOptions = description?.[key]?.enum;

                if (key === 'enabled') return null;
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <label>{t(`config_label_${key}`)}:</label>

                    {!isSelect && (
                      <input
                        className="bg-neutral rounded-md p-1"
                        name={key}
                        onChange={handleChange}
                        type="text"
                        value={String(currentValue)}
                      />
                    )}
                    {isSelect && (
                      <select
                        className="px-2 py-1"
                        value={String(currentValue)}
                        onChange={handleChange}
                        name={key}
                      >
                        {selectOptions.map((option: string) => {
                          return (
                            <option value={option} key={option}>
                              {option}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                );
              })}

           <Button
              onClick={saveInitialConfig}
              isLoading={isLoading}
              isEnabled={!isLoading}
            >
              {t('generic_save_button')}
            </Button>
            {hasConfigUpdated && (
              <Information>{t('config_updated')}</Information>
            )}
          </Card>
        )}

       {enabledConfigs.length > 0 && isGeneralConfigEnabled && (
          <div className="flex flex-col gap-10">
            <Switcher
              options={enabledConfigs}
              selectedOption={selectedConfig}
              setSelectedOption={setSelectedConfig}
            />

            <Card className="flex flex-col gap-10">
              {currentConfig && (
                <div
                  key={`${currentConfig.slug}`}
                  className="flex flex-col gap-4"
                >
                  <Heading level={2}>
                    {capitalizeFirstLetter(currentConfig.slug)}
                  </Heading>

                  {Object.entries(currentConfig.value).map(([key, value]) => {
                    const currentValue = currentConfig.value[key];

                    const description = mergedConfigDescription?.find(
                      (c) => c.slug === currentConfig.slug,
                    )?.value as Record<string, any>;
                    const inputType = description?.[key]?.type;
                    const isArray = Array.isArray(inputType);
                    const isSelect = inputType === 'select';
                    const selectOptions = description?.[key]?.enum;

                    if (key === 'enabled') {
                      return null;
                    }

                    return (
                      <>
                        {key !== 'enabled' && (
                          <div
                            key={`${currentConfig.slug}-${key}`}
                            className="flex flex-col gap-1"
                          >
                            {!isArray && (
                              <label>{t(`config_label_${key}`)}:</label>
                            )}
                            {typeof value === 'boolean' ? (
                              <div className="flex gap-3">
                                <label className="flex gap-1 items-center">
                                  <input
                                    type="radio"
                                    name={key}
                                    value="true"
                                    checked={currentValue === true}
                                    onChange={handleChange}
                                  />
                                  {t('config_true')}
                                </label>
                                <label className="flex gap-1 items-center">
                                  <input
                                    type="radio"
                                    name={key}
                                    value="false"
                                    checked={currentValue === false}
                                    onChange={handleChange}
                                  />
                                  {t('config_false')}
                                </label>
                              </div>
                            ) : (
                              <div>
                                {isArray && (
                                  <div>
                                    <ArrayConfig
                                      currentValue={currentValue}
                                      handleChange={handleChange}
                                      handleAddElement={handleAddElement}
                                      handleDeleteElement={handleDeleteElement}
                                      elementsKey={key}
                                      description={description}
                                      slug={currentConfig.slug}
                                      resetToDefault={resetToDefault}
                                      errors={errors}
                                    />
                                  </div>
                                )}
                                {!isArray && !isSelect && (
                                  <input
                                    className="bg-neutral rounded-md p-1"
                                    name={key}
                                    onChange={handleChange}
                                    type="text"
                                    value={String(currentValue)}
                                  />
                                )}

                                {errors[key] && (
                                  <ErrorMessage
                                    error={errors[key].toString()}
                                  ></ErrorMessage>
                                )}

                                {isSelect && (
                                  <select
                                    className="px-2 py-1"
                                    value={String(currentValue)}
                                    onChange={handleChange}
                                    name={key}
                                  >
                                    {selectOptions.map((option: string) => {
                                      return (
                                        <option value={option} key={option}>
                                          {option}
                                        </option>
                                      );
                                    })}
                                  </select>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })}
                </div>
              )}

              <Button
                onClick={handleSaveConfig}
                isLoading={isLoading}
                isEnabled={
                  !isLoading &&
                  errors &&
                  Object.values(errors).every((value) => value === null)
                }
              >
                {t('generic_save_button')}
              </Button>
              {hasConfigUpdated && (
                <Information>{t('config_updated')}</Information>
              )}
            </Card>
          </div>
        )}
      </div>
      </AdminLayout>
    </div>
  );
};

ConfigPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [emailsRes, messages] = await Promise.all([
      api.get('/emails').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const defaultEmailsConfig = emailsRes?.data?.results;

    return {
      defaultEmailsConfig,
      error: null,
      messages,
    };
  } catch (err: unknown) {
    return {
      defaultEmailsConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default ConfigPage;