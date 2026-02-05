import Head from 'next/head';

import { ChangeEvent, useEffect, useState } from 'react';

import ArrayConfig from '../../components/ArrayConfig';
import AdminLayout from '../../components/Dashboard/AdminLayout';
import PhotosEditor from '../../components/PhotosEditor';
import {
  Button,
  Card,
  ErrorMessage,
  Heading,
  Information,
} from '../../components/ui';

import { ChevronDown, Lock, Settings } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { configDescription } from '../../config';
import { getValidationSchema } from '../../constants/validation.constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { Config } from '../../types';
import { BookingConfig } from '../../types/api';
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

const BETA_FEATURES = ['community', 'governance'];

interface Props {
  defaultEmailsConfig: ConfigType;
  error: null | string;
  bookingConfig: BookingConfig;
}

const ConfigPage = ({ defaultEmailsConfig, bookingConfig }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { platformAllowedConfigs } = useConfig() || {};
  const { user } = useAuth();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const isWeb3Enabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const isWeb3BookingEnabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';
  const isBlogEnabled = process.env.NEXT_PUBLIC_FEATURE_BLOG === 'true';
  const isCoursesEnabled = process.env.NEXT_PUBLIC_FEATURE_COURSES === 'true';
  const isReferralEnabled = process.env.NEXT_PUBLIC_FEATURE_REFERRAL === 'true';
  const isSubscriptionsEnabled = process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const featureEnvFlags: Record<string, boolean> = {
    booking: process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true',
    subscriptions: isSubscriptionsEnabled,
    blog: isBlogEnabled,
    courses: isCoursesEnabled,
    referral: isReferralEnabled,
    airdrop: isWeb3Enabled,
    governance: isWeb3Enabled,
    web3: isWeb3BookingEnabled,
  };

  const baseAllowedConfigs = [
    ...(platformAllowedConfigs || []),
    ...(isBookingEnabled && !platformAllowedConfigs?.includes('payment') ? ['payment'] : []),
    ...(isWeb3Enabled && !platformAllowedConfigs?.includes('airdrop') ? ['airdrop'] : []),
    ...(isWeb3Enabled && !platformAllowedConfigs?.includes('governance') ? ['governance'] : []),
    ...(isWeb3BookingEnabled && !platformAllowedConfigs?.includes('web3') ? ['web3'] : []),
    ...(!platformAllowedConfigs?.includes('events') ? ['events'] : []),
    ...(isBlogEnabled && !platformAllowedConfigs?.includes('blog') ? ['blog'] : []),
    ...(isCoursesEnabled && !platformAllowedConfigs?.includes('courses') ? ['courses'] : []),
    ...(isReferralEnabled && !platformAllowedConfigs?.includes('referral') ? ['referral'] : []),
  ];

  const effectiveAllowedConfigs = baseAllowedConfigs.filter((config) => {
    if (featureEnvFlags[config] === undefined) return true;
    return featureEnvFlags[config];
  });

  const myConfigs = platform.config.find();

  const filter = {};
  const mergedConfigDescription = configDescription.concat(defaultEmailsConfig);

  const allPossibleFeatures = mergedConfigDescription
    .map((config: any) => config?.slug)
    .filter(Boolean);

  const allConfigCategories = allPossibleFeatures
    .filter((config: any) => effectiveAllowedConfigs?.includes(config))
    .sort((a: string, b: string) => {
      if (a === 'general') return -1;
      if (b === 'general') return 1;
      return a.localeCompare(b);
    });

  const disabledByEnvironment = allPossibleFeatures.filter(
    (config: any) => !effectiveAllowedConfigs?.includes(config),
  );

  const [selectedConfig, setSelectedConfig] = useState('');
  const [updatedConfigs, setUpdatedConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfigUpdated, setHasConfigUpdated] = useState(false);
  const [enabledConfigs, setEnabledConfigs] = useState<string[]>([]);
  const [isGeneralConfigEnabled, setIsGeneralConfigEnabled] = useState(false);
  const [errors, setErrors] = useState<{
    [key: string]: string | null | undefined | any;
  }>({});

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
      setSelectedConfig('');
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

      // Log specific email template being saved
      if (configCategoryToSave === 'emails') {
        const elements = updatedConfig?.value?.elements;
        if (Array.isArray(elements)) {
          const financedTokenTemplate = elements.find(
            (element: any) => element.name === 'financedToken_decoupled_user',
          );
          if (financedTokenTemplate) {
            console.log(
              'Saving financedToken_decoupled_user template to database:',
              JSON.stringify(financedTokenTemplate, null, 2),
            );
          }
        }
      }

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
    const fieldKey =
      selectedConfig && name.startsWith(`${selectedConfig}-`)
        ? name.slice(selectedConfig.length + 1)
        : strippedName;

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
            value: { ...config.value, [fieldKey]: preparedInputValue },
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
              // Create a new element with default values but explicitly set lowerText to empty
              const resetElement = { ...defaultValue };
              // Always ensure lowerText is empty for email templates
              resetElement.lowerText = '';
              return resetElement;
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

  const handleAddElement = (elementsKey = 'elements') => {
    const defaultConfig = mergedConfigDescription as any;
    const configDesc = defaultConfig.find(
      (config: any) => config.slug === selectedConfig,
    );
    const defaultPlan = configDesc?.value?.[elementsKey]?.default;
    
    if (!defaultPlan || !Array.isArray(defaultPlan)) {
      return;
    }

    const newConfigs = [
      ...updatedConfigs.map((config) => {
        if (config.slug === selectedConfig) {
          const currentArray: any = config.value[elementsKey] || [];
          const newElement = defaultPlan[0] ? { ...defaultPlan[0] } : {};
          const newArray = [...currentArray, newElement];
          return {
            ...config,
            value: { ...config.value, [elementsKey]: newArray },
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
    <>
      <Head>
        <title>{t('platform_configs')}</title>
      </Head>

      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Settings className="w-5 h-5 text-accent" />
            </div>
            <Heading level={2}>{t('platform_configs')}</Heading>
          </div>

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
                ).map(([key]) => {
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
                  const isTime = inputType === 'time';

                  if (key === 'enabled') return null;
                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">{t(`config_label_${key}`)}</label>

                      {!isSelect && !isTime && (
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                          name={key}
                          onChange={handleChange}
                          type="text"
                          value={String(currentValue)}
                        />
                      )}
                      {isTime && (
                        <input
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                          name={key}
                          onChange={handleChange}
                          type="time"
                          value={String(currentValue)}
                        />
                      )}
                      {isSelect && (
                        <select
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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

          {isGeneralConfigEnabled && (
            <div className="w-full flex flex-col gap-3">
              {allConfigCategories.map((configSlug) => {
                const isGeneral = configSlug === 'general';
                const isEnabled = isGeneral || enabledConfigs?.includes(configSlug);
                const configData = updatedConfigs.find(
                  (c) => c.slug === configSlug,
                );

                if (!configData) return null;

                const description = mergedConfigDescription?.find(
                  (c) => c.slug === configSlug,
                )?.value as Record<string, any>;

                return (
                  <div
                    key={configSlug}
                    className={`w-full rounded-lg border overflow-hidden ${
                      isEnabled
                        ? 'border-gray-200 bg-white'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedConfig(
                          selectedConfig === configSlug ? '' : configSlug,
                        );
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {!isGeneral && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleConfig(configSlug);
                            }}
                            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                              isEnabled ? 'bg-accent' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                isEnabled ? 'left-4' : 'left-0.5'
                              }`}
                            />
                          </button>
                        )}
                        <span
                          className={`text-sm font-medium ${
                            isEnabled ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {capitalizeFirstLetter(configSlug)}
                          {BETA_FEATURES.includes(configSlug) && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                              Beta
                            </span>
                          )}
                        </span>
                      </div>
                      {isEnabled && (
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            selectedConfig === configSlug ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>

                    {isEnabled && selectedConfig === configSlug && (
                        <div className="border-t border-gray-100 p-4 flex flex-col gap-4">
                          {Object.entries(configData.value).map(
                            ([key, value]) => {
                              const currentValue = configData.value[key];
                              const inputType = description?.[key]?.type;
                              const isArray = Array.isArray(inputType);
                              const isSelect = inputType === 'select';
                              const isTime = inputType === 'time';
                              const selectOptions = description?.[key]?.enum;

                              if (key === 'enabled') return null;

                              return (
                                <div
                                  key={`${configSlug}-${key}`}
                                  className="flex flex-col gap-1"
                                >
                                  {!isArray && (
                                    <label className="text-sm font-medium text-gray-700">
                                      {t(`config_label_${key}`)}
                                    </label>
                                  )}
                                  {typeof value === 'boolean' ? (
                                    <div className="flex gap-4">
                                      <label className="flex gap-2 items-center text-sm cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`${configSlug}-${key}`}
                                          value="true"
                                          checked={currentValue === true}
                                          onChange={(e) => {
                                            setSelectedConfig(configSlug);
                                            handleChange(e, '', null);
                                          }}
                                          className="w-4 h-4 text-accent"
                                        />
                                        {t('config_true')}
                                      </label>
                                      <label className="flex gap-2 items-center text-sm cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`${configSlug}-${key}`}
                                          value="false"
                                          checked={currentValue === false}
                                          onChange={(e) => {
                                            setSelectedConfig(configSlug);
                                            handleChange(e, '', null);
                                          }}
                                          className="w-4 h-4 text-accent"
                                        />
                                        {t('config_false')}
                                      </label>
                                    </div>
                                  ) : (
                                    <div>
                                      {configSlug === 'photo-gallery' &&
                                      key === 'photoIds' ? (
                                        <PhotosEditor
                                          value={currentValue || []}
                                          onChange={(value: string[]) => {
                                            const newConfigs =
                                              updatedConfigs.map((config) => {
                                                if (
                                                  config.slug === configSlug
                                                ) {
                                                  return {
                                                    ...config,
                                                    value: {
                                                      ...config.value,
                                                      [key]: value,
                                                    },
                                                  };
                                                }
                                                return config;
                                              });
                                            setUpdatedConfigs(newConfigs);
                                          }}
                                        />
                                      ) : isArray ? (
                                        <ArrayConfig
                                          currentValue={currentValue}
                                          handleChange={(e, k, i) => {
                                            setSelectedConfig(configSlug);
                                            handleChange(e, k, i);
                                          }}
                                          handleAddElement={handleAddElement}
                                          handleDeleteElement={
                                            handleDeleteElement
                                          }
                                          elementsKey={key}
                                          description={description}
                                          slug={configSlug}
                                          resetToDefault={resetToDefault}
                                          errors={errors}
                                        />
                                      ) : null}
                                      {!isArray && !isSelect && !isTime && (
                                        <input
                                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                          name={key}
                                          onChange={(e) => {
                                            setSelectedConfig(configSlug);
                                            handleChange(e);
                                          }}
                                          type="text"
                                          value={String(currentValue)}
                                        />
                                      )}
                                      {isTime && (
                                        <input
                                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                          name={key}
                                          onChange={(e) => {
                                            setSelectedConfig(configSlug);
                                            handleChange(e);
                                          }}
                                          type="time"
                                          value={String(currentValue)}
                                        />
                                      )}
                                      {errors[key] && (
                                        <ErrorMessage
                                          error={errors[key].toString()}
                                        />
                                      )}
                                      {isSelect && (
                                        <select
                                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                          value={String(currentValue)}
                                          onChange={(e) => {
                                            setSelectedConfig(configSlug);
                                            handleChange(e);
                                          }}
                                          name={key}
                                        >
                                          {selectOptions?.map(
                                            (option: string) => (
                                              <option
                                                value={option}
                                                key={option}
                                              >
                                                {option}
                                              </option>
                                            ),
                                          )}
                                        </select>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}

                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => handleSaveConfig([], configSlug)}
                              isLoading={isLoading}
                              isEnabled={
                                !isLoading &&
                                errors &&
                                Object.values(errors).every(
                                  (value) => value === null,
                                )
                              }
                              variant="inline"
                              size="small"
                            >
                              {t('generic_save_button')}
                            </Button>
                            {hasConfigUpdated &&
                              selectedConfig === configSlug && (
                                <Information>{t('config_updated')}</Information>
                              )}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}

          {disabledByEnvironment.length > 0 && (
            <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-gray-200 rounded">
                  <Lock className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {t('config_disabled_features_title')}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    {t('config_disabled_features_description')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {disabledByEnvironment.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded"
                      >
                        {capitalizeFirstLetter(feature)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
};

ConfigPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [emailsRes, bookingRes, messages] = await Promise.all([
      api.get('/emails').catch(() => null),
      api.get('/config/booking').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const defaultEmailsConfig = emailsRes?.data?.results;
    const bookingConfig = bookingRes?.data?.results?.value;

    return {
      defaultEmailsConfig,
      bookingConfig,
      error: null,
      messages,
    };
  } catch (err: unknown) {
    return {
      defaultEmailsConfig: null,
      bookingConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default ConfigPage;
