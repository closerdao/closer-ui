import Head from 'next/head';
import { useRouter } from 'next/router';

import { ChangeEvent, useEffect, useState } from 'react';

import AccountingEntitiesVatFields from '../../components/AccountingEntitiesVatFields';
import ArrayConfig from '../../components/ArrayConfig';
import ConfigImageUpload from '../../components/ConfigImageUpload';
import AdminLayout from '../../components/Dashboard/AdminLayout';
import FaviconUpload from '../../components/FaviconUpload';
import PhotosEditor from '../../components/PhotosEditor';
import {
  Button,
  Card,
  ErrorMessage,
  Heading,
  Information,
} from '../../components/ui';

import {
  Check,
  ChevronDown,
  Copy,
  Lock,
  Rocket,
  Save,
  Settings,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { configDescription } from '../../config';
import {
  BETA_FEATURES,
  FEATURE_FLAG_BY_CONFIG,
  HIDDEN_CONFIGS,
  getEffectiveAllowedConfigs,
} from '../../constants/featureFlags';
import { getValidationSchema } from '../../constants/validation.constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { Config, SubscriptionPlan } from '../../types';
import { BookingConfig } from '../../types/api';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import {
  getArrayConfigsSchema,
  getDefaultConfigValue,
  getEnabledConfigs,
  getPreparedInputValue,
  getUpdatedArray,
  makeConfigLabel,
  prepareConfigs,
} from '../../utils/config.utils';
import { capitalizeFirstLetter } from '../../utils/learn.helpers';
import { syncSubscriptionPlansWithStripe } from '../../utils/subscriptionPlansSync';
import { filterCitizenAndFreeFromElements } from '../../utils/subscriptions.helpers';
import PageNotFound from '../not-found';

const FUNDRAISER_CONFIG_KEYS_ORDER = [
  'amountRaisedPreCampaign',
  'loansCollectedTotal',
  'campaignVideo',
  'campaignTitle',
  'creditPricePerUnit',
  'adjustmentsLabel',
  'milestones',
  'packages',
];

const ACCOUNTING_ENTITIES_CONFIG_KEYS_ORDER = ['elements', 'vatByProductType'];

/**
 * Stored configs still carry the pre-flattening nested shapes (`utilityFiat:
 * {val, cur}`, `seasons.high`, `discounts`, `cancellationPolicy`,
 * `conditions`), which the schema replaced with flat fields like
 * `utilityFiatVal` and `seasonsHighStart`. Nothing reads them any more, and the
 * flat editor renders them as an unlabelled `[object Object]` text input, so
 * only offer keys the schema still describes. They stay in `configData.value`,
 * so saving round-trips them untouched rather than silently deleting them.
 */
const isEditableConfigKey = (
  key: string,
  description: Record<string, any> | undefined,
) =>
  Boolean(description) &&
  Object.prototype.hasOwnProperty.call(description, key);

const ConfigPage = () => {
  const t = useTranslations();
  const configLabel = makeConfigLabel(t as any);
  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const router = useRouter();
  // Locales are fixed at build time by next.config.js; the localization
  // config can only narrow that list, never add to it.
  const availableLocales: readonly string[] = router.locales ?? [];

  const [bookingConfig, setBookingConfig] = useState<BookingConfig | null>(
    null,
  );

  const isBookingAllowedByEnv =
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const isBookingEnabled =
    Boolean(bookingConfig?.enabled) && isBookingAllowedByEnv;

  const isCoursesEnabled = process.env.NEXT_PUBLIC_FEATURE_COURSES === 'true';

  const effectiveAllowedConfigs = getEffectiveAllowedConfigs();

  const myConfigs = platform.config.find();

  const mergedConfigDescription = configDescription;

  const allPossibleFeatures = mergedConfigDescription
    .map((config: any) => config?.slug)
    .filter((slug: string) => Boolean(slug) && !HIDDEN_CONFIGS.includes(slug));

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

  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);

  const copyFeatureFlag = async (feature: string) => {
    const flag = FEATURE_FLAG_BY_CONFIG[feature];
    if (!flag || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(`${flag}=true`);
      setCopiedFlag(feature);
      setTimeout(() => setCopiedFlag(null), 2000);
    } catch (err) {
      console.error('Failed to copy feature flag', err);
    }
  };

  const [selectedConfig, setSelectedConfig] = useState('');
  const [updatedConfigs, setUpdatedConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfigUpdated, setHasConfigUpdated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Server-side snapshot, used to work out which configs have unsaved edits.
  const [savedConfigs, setSavedConfigs] = useState<Config[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [deployError, setDeployError] = useState<string | null>(null);
  const [enabledConfigs, setEnabledConfigs] = useState<string[]>([]);
  const [isGeneralConfigEnabled, setIsGeneralConfigEnabled] = useState(false);
  const [errors, setErrors] = useState<{
    [key: string]: string | null | undefined | any;
  }>({});

  const arrayConfigsSchema = getArrayConfigsSchema(updatedConfigs);

  const configFormSchema = getValidationSchema(arrayConfigsSchema);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load config once on mount to avoid GET /config loop
  }, []);

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
      setSavedConfigs(preparedConfigs);
      setEnabledConfigs(enabledConfigs);
    }
  }, [myConfigs]);

  const dirtyConfigSlugs = updatedConfigs
    .filter((config) => {
      const saved = savedConfigs.find((c) => c.slug === config.slug);
      return JSON.stringify(saved?.value) !== JSON.stringify(config.value);
    })
    .map((config) => config.slug);

  const hasValidationErrors = Object.values(errors).some(
    (value) => value !== null && value !== undefined,
  );

  const loadData = async () => {
    try {
      platform.config.get();
    } catch (err) {
      console.log('Load error', err);
    }
  };

  const saveInitialConfig = async () => {
    const initialConfigCategories = ['general'];
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

  const handleResetToDefaults = async (configSlug: string) => {
    const defaultValue = getDefaultConfigValue(
      configSlug,
      mergedConfigDescription,
    );
    const newConfigs = updatedConfigs.map((config) =>
      config.slug === configSlug ? { ...config, value: defaultValue } : config,
    );
    setUpdatedConfigs(newConfigs);
    await handleSaveConfig(newConfigs, configSlug);
    await loadData();
  };

  const handleSaveConfig = async (
    newConfigs: Config[] = [],
    configCategory = '',
  ) => {
    const configCategoryToSave = configCategory || selectedConfig;
    let configsToSave = newConfigs.length > 0 ? newConfigs : updatedConfigs;

    let updatedConfig = configsToSave.find(
      (config) => config.slug === configCategoryToSave,
    );

    try {
      setIsLoading(true);
      setSaveError(null);

      if (configCategoryToSave === 'subscriptions' && updatedConfig?.value) {
        const paymentFromUpdated = configsToSave.find(
          (config) => config.slug === 'payment',
        );
        const paymentFromPlatform = platform.config
          .findOne('payment')
          ?.get?.('value')
          ?.toJS?.();
        const currency =
          paymentFromUpdated?.value?.fiatCur ||
          paymentFromUpdated?.value?.utilityFiatCur ||
          paymentFromPlatform?.fiatCur ||
          paymentFromPlatform?.utilityFiatCur ||
          'EUR';
        const filteredElements = filterCitizenAndFreeFromElements(
          (updatedConfig.value.elements as unknown as SubscriptionPlan[]) || [],
        );
        const syncedElements = await syncSubscriptionPlansWithStripe(
          filteredElements,
          currency,
        );
        const syncedValue = {
          ...updatedConfig.value,
          elements: syncedElements,
        } as unknown as Config['value'];
        configsToSave = configsToSave.map((config) =>
          config.slug === 'subscriptions'
            ? { ...config, value: syncedValue }
            : config,
        );
        updatedConfig = {
          ...updatedConfig,
          value: syncedValue,
        };
        setUpdatedConfigs(configsToSave);
      }

      const configExists = myConfigs
        .toJS()
        .some((config: any) => config.slug === configCategoryToSave);

      if (configExists) {
        await platform.config.patch(configCategoryToSave, {
          slug: configCategoryToSave,
          value: updatedConfig?.value,
        });
      } else {
        await platform.config.post({
          slug: configCategoryToSave,
          value: updatedConfig?.value,
        });
      }

      await platform.config.getOne(configCategoryToSave, { force: true });

      // platform.config.find() is not refreshed by patch/getOne (the store
      // syncs byFilter by _id, but configs are addressed by slug), so mark
      // this slug as saved locally or it stays "dirty" forever.
      const savedValue = updatedConfig?.value;
      setSavedConfigs((prev) =>
        prev.map((config) =>
          config.slug === configCategoryToSave
            ? { ...config, value: savedValue as Config['value'] }
            : config,
        ),
      );

      if (configCategoryToSave === 'booking') {
        const bookingDocAfter = platform.config.findOne('booking');
        setBookingConfig(bookingDocAfter?.get?.('value')?.toJS?.() ?? null);
      }

      setHasConfigUpdated(false);
      setHasConfigUpdated(true);
      setTimeout(() => {
        setHasConfigUpdated(false);
      }, 3000);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : t('config_subscriptions_sync_error'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    // Save every dirty config against the same in-memory snapshot so a
    // refetch triggered by one save cannot wipe the unsaved edits of another.
    const snapshot = updatedConfigs;
    for (const slug of dirtyConfigSlugs) {
      await handleSaveConfig(snapshot, slug);
    }
  };

  const handleDeploy = async () => {
    if (!window.confirm(t('config_deploy_confirm'))) return;
    try {
      setIsDeploying(true);
      setDeployStatus('idle');
      setDeployError(null);
      await api.post('/deploy', {});
      setDeployStatus('success');
      setTimeout(() => setDeployStatus('idle'), 5000);
    } catch (error) {
      setDeployStatus('error');
      setDeployError(parseMessageFromError(error) || t('config_deploy_error'));
    } finally {
      setIsDeploying(false);
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
              return { ...defaultValue };
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
    const schema = configDesc?.value?.[elementsKey]?.type?.[0];

    let newElement: Record<string, unknown> = {};
    if (defaultPlan && Array.isArray(defaultPlan) && defaultPlan[0]) {
      newElement = { ...defaultPlan[0] };
    } else if (schema && typeof schema === 'object') {
      Object.keys(schema).forEach((key) => {
        const fieldType = schema[key];
        if (fieldType === 'number') {
          newElement[key] = 0;
        } else {
          newElement[key] = '';
        }
      });
    } else {
      return;
    }

    const newConfigs = [
      ...updatedConfigs.map((config) => {
        if (config.slug === selectedConfig) {
          const currentArray: any = config.value[elementsKey] || [];
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

  const handleDeleteElement = (index: number, elementsKey = 'elements') => {
    const newConfigs = [
      ...updatedConfigs.map((config) => {
        if (config.slug === selectedConfig) {
          const elements: any = config.value[elementsKey];
          if (!Array.isArray(elements)) {
            return config;
          }
          const updatedElements = elements.filter(
            (_: any, idx: number) => idx !== index,
          );
          return {
            ...config,
            value: { ...config.value, [elementsKey]: updatedElements },
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

      <AdminLayout>
        <div className="w-full max-w-5xl flex flex-col gap-6 max-h-[calc(100vh-5rem)] xl:max-h-[calc(100vh-2rem)]">
          <div className="flex-shrink-0 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Settings className="w-5 h-5 text-accent" />
              </div>
              <Heading level={2} className="flex-1">
                {t('platform_configs')}
              </Heading>
              {isGeneralConfigEnabled && (
                <div className="flex flex-wrap items-center gap-3">
                  {hasConfigUpdated && (
                    <Information>{t('config_updated')}</Information>
                  )}
                  {saveError && <ErrorMessage error={saveError} />}
                  {deployStatus === 'success' && (
                    <Information>{t('config_deploy_success')}</Information>
                  )}
                  {deployStatus === 'error' && (
                    <ErrorMessage
                      error={deployError || t('config_deploy_error')}
                    />
                  )}
                  <Button
                    onClick={handleSaveAll}
                    isLoading={isLoading}
                    isEnabled={
                      !isLoading &&
                      !isDeploying &&
                      dirtyConfigSlugs.length > 0 &&
                      !hasValidationErrors
                    }
                    variant="inline"
                    size="small"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Save className="w-4 h-4" />
                      {dirtyConfigSlugs.length > 0
                        ? t('config_save_with_count', {
                            count: dirtyConfigSlugs.length,
                          })
                        : t('generic_save_button')}
                    </span>
                  </Button>
                  <Button
                    onClick={handleDeploy}
                    isLoading={isDeploying}
                    isEnabled={
                      !isLoading &&
                      !isDeploying &&
                      dirtyConfigSlugs.length === 0
                    }
                    variant="inline"
                    size="small"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Rocket className="w-4 h-4" />
                      {t('config_deploy')}
                    </span>
                  </Button>
                </div>
              )}
            </div>
            {isGeneralConfigEnabled && (
              <p className="text-xs text-gray-500">
                {t('admin_platform_changes_production_delay')}
              </p>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 pr-1">
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
                    const generalConfig = updatedConfigs.find(
                      (config) => config.slug === 'general',
                    );
                    const currentValue: string | number | boolean | any[] =
                      generalConfig?.value[key] ?? [];
                    const description = mergedConfigDescription?.find(
                      (c) => c.slug === 'general',
                    )?.value as Record<string, any>;
                    const inputType = description?.[key]?.type;
                    const isSelect = inputType === 'select';
                    let selectOptions = description?.[key]?.enum;
                    if (
                      isSelect &&
                      (key === 'primaryCtaVisitor' ||
                        key === 'primaryCtaMember')
                    ) {
                      const application = enabledConfigs?.includes(
                        'applications',
                      )
                        ? ['application']
                        : [];
                      const baseVisitor = [
                        'none',
                        'login',
                        ...(isBookingEnabled ? ['bookings'] : []),
                        ...(isCoursesEnabled ? ['learningHub'] : []),
                        'events',
                        ...application,
                        'custom',
                      ];
                      const baseMember = [
                        'none',
                        ...(isBookingEnabled ? ['bookings'] : []),
                        ...(isCoursesEnabled ? ['learningHub'] : []),
                        'events',
                        ...application,
                        'custom',
                      ];
                      selectOptions =
                        key === 'primaryCtaVisitor' ? baseVisitor : baseMember;
                    }
                    const isTime = inputType === 'time';
                    const isImage = inputType === 'image';

                    if (key === 'enabled') return null;
                    if (!isEditableConfigKey(key, description)) return null;
                    if (
                      (key === 'primaryCtaCustomUrl' ||
                        key === 'primaryCtaCustomText') &&
                      generalConfig?.value?.primaryCtaVisitor !== 'custom' &&
                      generalConfig?.value?.primaryCtaMember !== 'custom'
                    ) {
                      return null;
                    }
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">
                          {configLabel(key)}
                        </label>

                        {isImage &&
                          (() => {
                            const handleImageChange = (url: string) => {
                              const newConfigs = updatedConfigs.map(
                                (config) => {
                                  if (config.slug === 'general') {
                                    return {
                                      ...config,
                                      value: { ...config.value, [key]: url },
                                    };
                                  }
                                  return config;
                                },
                              );
                              setUpdatedConfigs(newConfigs);
                            };

                            return key === 'favicon' ? (
                              <FaviconUpload
                                value={String(currentValue)}
                                onChange={handleImageChange}
                                platformName={String(
                                  generalConfig?.value?.platformName ?? '',
                                )}
                              />
                            ) : (
                              <ConfigImageUpload
                                value={String(currentValue)}
                                onChange={handleImageChange}
                              />
                            );
                          })()}
                        {!isSelect && !isTime && !isImage && (
                          <input
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                            name={key}
                            onChange={handleChange}
                            type="text"
                            value={String(currentValue)}
                          />
                        )}
                        {isTime && (
                          <input
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                            name={key}
                            onChange={handleChange}
                            type="time"
                            value={String(currentValue)}
                          />
                        )}
                        {isSelect && (
                          <select
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                            value={String(
                              selectOptions?.includes(currentValue)
                                ? currentValue
                                : selectOptions?.[0] ?? '',
                            )}
                            onChange={handleChange}
                            name={key}
                          >
                            {selectOptions?.map((option: string) => {
                              return (
                                <option value={option} key={option}>
                                  {[
                                    'none',
                                    'login',
                                    'bookings',
                                    'learningHub',
                                    'events',
                                    'application',
                                    'custom',
                                  ].includes(option)
                                    ? t(`config_option_cta_${option}`)
                                    : option}
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
                  variant="inline"
                  size="small"
                  className="self-start"
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
                  const isEnabled =
                    isGeneral || enabledConfigs?.includes(configSlug);
                  const configData = updatedConfigs.find(
                    (c) => c.slug === configSlug,
                  );

                  if (!configData) return null;

                  const description = mergedConfigDescription?.find(
                    (c) => c.slug === configSlug,
                  )?.value as Record<string, any>;

                  // Features whose only setting is the on/off switch get a
                  // plain toggle row instead of an expandable card.
                  const hasSettings = Object.keys(configData.value).some(
                    (key) =>
                      key !== 'enabled' &&
                      isEditableConfigKey(key, description),
                  );
                  const isExpandable = isEnabled && hasSettings;

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
                        className={`flex items-center justify-between p-3 ${
                          isExpandable ? 'cursor-pointer hover:bg-gray-50' : ''
                        }`}
                        onClick={() => {
                          if (!isExpandable) return;
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
                        {isExpandable && (
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              selectedConfig === configSlug ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </div>

                      {isExpandable && selectedConfig === configSlug && (
                        <div className="border-t border-gray-100 p-4 flex flex-col gap-4">
                          {(configSlug === 'fundraiser'
                            ? FUNDRAISER_CONFIG_KEYS_ORDER.filter((k) =>
                                Object.prototype.hasOwnProperty.call(
                                  configData.value,
                                  k,
                                ),
                              ).map((k) => [k, configData.value[k]] as const)
                            : configSlug === 'accounting-entities'
                            ? ACCOUNTING_ENTITIES_CONFIG_KEYS_ORDER.filter(
                                (k) =>
                                  Object.prototype.hasOwnProperty.call(
                                    configData.value,
                                    k,
                                  ),
                              ).map((k) => [k, configData.value[k]] as const)
                            : Object.entries(configData.value).filter(([key]) =>
                                isEditableConfigKey(key, description),
                              )
                          ).map(([key, value]) => {
                            const currentValue = configData.value[key];
                            const inputType = description?.[key]?.type;
                            const isArray = Array.isArray(inputType);
                            const isSelect = inputType === 'select';
                            const isTime = inputType === 'time';
                            const isImage = inputType === 'image';
                            let selectOptions = description?.[key]?.enum;
                            if (
                              isSelect &&
                              (key === 'primaryCtaVisitor' ||
                                key === 'primaryCtaMember')
                            ) {
                              const application = enabledConfigs?.includes(
                                'applications',
                              )
                                ? ['application']
                                : [];
                              const baseVisitor = [
                                'none',
                                'login',
                                ...(isBookingEnabled ? ['bookings'] : []),
                                ...(isCoursesEnabled ? ['learningHub'] : []),
                                ...(enabledConfigs?.includes('events')
                                  ? ['events']
                                  : []),
                                ...application,
                                'custom',
                              ];
                              const baseMember = [
                                'none',
                                ...(isBookingEnabled ? ['bookings'] : []),
                                ...(isCoursesEnabled ? ['learningHub'] : []),
                                ...(enabledConfigs?.includes('events')
                                  ? ['events']
                                  : []),
                                ...application,
                                'custom',
                              ];
                              selectOptions =
                                key === 'primaryCtaVisitor'
                                  ? baseVisitor
                                  : baseMember;
                            }

                            if (key === 'enabled') return null;
                            if (
                              (key === 'primaryCtaCustomUrl' ||
                                key === 'primaryCtaCustomText') &&
                              configSlug === 'general' &&
                              configData.value?.primaryCtaVisitor !==
                                'custom' &&
                              configData.value?.primaryCtaMember !== 'custom'
                            ) {
                              return null;
                            }

                            if (
                              configSlug === 'accounting-entities' &&
                              key === 'vatByProductType'
                            ) {
                              const paymentVal = updatedConfigs.find(
                                (c) => c.slug === 'payment',
                              )?.value;
                              const defaultVatRate = paymentVal?.vatRate as
                                | number
                                | undefined;
                              const vatMap =
                                currentValue &&
                                typeof currentValue === 'object' &&
                                !Array.isArray(currentValue)
                                  ? (currentValue as Record<
                                      string,
                                      number | undefined
                                    >)
                                  : {};
                              return (
                                <div
                                  key={`${configSlug}-${key}`}
                                  className="flex flex-col gap-2"
                                >
                                  <h4 className="text-sm font-semibold text-gray-800">
                                    {t('config_section_accounting_vat')}
                                  </h4>
                                  <AccountingEntitiesVatFields
                                    elements={
                                      Array.isArray(configData.value.elements)
                                        ? configData.value.elements
                                        : []
                                    }
                                    vatByProductType={vatMap}
                                    defaultVatRate={defaultVatRate}
                                    onChange={(next) => {
                                      setUpdatedConfigs(
                                        updatedConfigs.map((config) =>
                                          config.slug === configSlug
                                            ? {
                                                ...config,
                                                value: {
                                                  ...config.value,
                                                  vatByProductType: next,
                                                } as unknown as Config['value'],
                                              }
                                            : config,
                                        ),
                                      );
                                    }}
                                  />
                                </div>
                              );
                            }

                            if (
                              configSlug === 'localization' &&
                              key === 'languages'
                            ) {
                              const selectedLanguages = Array.isArray(
                                currentValue,
                              )
                                ? (currentValue as string[])
                                : [];
                              const setLanguages = (next: string[]) => {
                                setUpdatedConfigs(
                                  updatedConfigs.map((config) =>
                                    config.slug === configSlug
                                      ? {
                                          ...config,
                                          value: {
                                            ...config.value,
                                            languages: next,
                                          },
                                        }
                                      : config,
                                  ),
                                );
                              };
                              return (
                                <div
                                  key={`${configSlug}-${key}`}
                                  className="flex flex-col gap-2"
                                >
                                  <label className="text-sm font-medium text-gray-700">
                                    {configLabel(key)}
                                  </label>
                                  <p className="text-xs text-gray-500">
                                    {t('config_localization_languages_help')}
                                  </p>
                                  <div className="flex flex-wrap gap-4">
                                    {availableLocales.map((locale) => {
                                      const isChecked =
                                        selectedLanguages.includes(locale);
                                      return (
                                        <label
                                          key={locale}
                                          className="flex gap-2 items-center text-sm cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            name={`${configSlug}-${key}-${locale}`}
                                            checked={isChecked}
                                            onChange={() => {
                                              setSelectedConfig(configSlug);
                                              setLanguages(
                                                isChecked
                                                  ? selectedLanguages.filter(
                                                      (l) => l !== locale,
                                                    )
                                                  : availableLocales.filter(
                                                      (l) =>
                                                        l === locale ||
                                                        selectedLanguages.includes(
                                                          l,
                                                        ),
                                                    ),
                                              );
                                            }}
                                            className="w-4 h-4 text-accent"
                                          />
                                          <span className="uppercase">
                                            {locale}
                                          </span>
                                          {locale === router.defaultLocale && (
                                            <span className="text-xs text-gray-400">
                                              (
                                              {t(
                                                'config_localization_default_locale',
                                              )}
                                              )
                                            </span>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }

                            const fundraiserSectionKey =
                              configSlug === 'fundraiser' &&
                              (key === 'milestones' || key === 'packages')
                                ? key
                                : null;

                            return (
                              <div
                                key={`${configSlug}-${key}`}
                                className="flex flex-col gap-1"
                              >
                                {fundraiserSectionKey && (
                                  <h4 className="text-sm font-semibold text-gray-800 mt-4 mb-1 first:mt-0">
                                    {t(
                                      `config_section_fundraiser_${fundraiserSectionKey}`,
                                    )}
                                  </h4>
                                )}
                                <label className="text-sm font-medium text-gray-700">
                                  {configLabel(key)}
                                </label>
                                {isImage ? (
                                  (() => {
                                    const handleImageChange = (url: string) => {
                                      const newConfigs = updatedConfigs.map(
                                        (config) => {
                                          if (config.slug === configSlug) {
                                            return {
                                              ...config,
                                              value: {
                                                ...config.value,
                                                [key]: url,
                                              },
                                            };
                                          }
                                          return config;
                                        },
                                      );
                                      setUpdatedConfigs(newConfigs);
                                    };

                                    return key === 'favicon' ? (
                                      <FaviconUpload
                                        value={String(currentValue)}
                                        onChange={handleImageChange}
                                        platformName={String(
                                          updatedConfigs.find(
                                            (c) => c.slug === 'general',
                                          )?.value?.platformName ?? '',
                                        )}
                                      />
                                    ) : (
                                      <ConfigImageUpload
                                        value={String(currentValue)}
                                        onChange={handleImageChange}
                                      />
                                    );
                                  })()
                                ) : typeof value === 'boolean' ? (
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
                                          const newConfigs = updatedConfigs.map(
                                            (config) => {
                                              if (config.slug === configSlug) {
                                                return {
                                                  ...config,
                                                  value: {
                                                    ...config.value,
                                                    [key]: value,
                                                  },
                                                };
                                              }
                                              return config;
                                            },
                                          );
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
                                    {!isArray &&
                                      !isSelect &&
                                      !isTime &&
                                      !isImage && (
                                        <input
                                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        value={String(
                                          selectOptions?.includes(currentValue)
                                            ? currentValue
                                            : selectOptions?.[0] ?? '',
                                        )}
                                        onChange={(e) => {
                                          setSelectedConfig(configSlug);
                                          handleChange(e);
                                        }}
                                        name={key}
                                      >
                                        {selectOptions?.map(
                                          (option: string) => (
                                            <option value={option} key={option}>
                                              {[
                                                'none',
                                                'login',
                                                'bookings',
                                                'learningHub',
                                                'events',
                                                'application',
                                                'custom',
                                              ].includes(option)
                                                ? t(
                                                    `config_option_cta_${option}`,
                                                  )
                                                : option}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    t('config_reset_to_defaults_confirm'),
                                  )
                                ) {
                                  handleResetToDefaults(configSlug);
                                }
                              }}
                              className="text-sm text-gray-500 underline underline-offset-2 hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {t('config_reset_to_defaults')}
                            </button>
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
                      {disabledByEnvironment.map((feature) => {
                        const flag = FEATURE_FLAG_BY_CONFIG[feature];
                        return (
                          <span
                            key={feature}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded"
                          >
                            {capitalizeFirstLetter(feature)}
                            {flag && (
                              <button
                                type="button"
                                onClick={() => copyFeatureFlag(feature)}
                                title={`${flag}=true`}
                                aria-label={t('config_copy_feature_flag', {
                                  flag,
                                })}
                                className="p-0.5 rounded hover:bg-gray-300 text-gray-500 hover:text-gray-700"
                              >
                                {copiedFlag === feature ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default ConfigPage;
