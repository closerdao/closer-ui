import Head from 'next/head';

import { ChangeEvent, useEffect, useState } from 'react';

import PlansConfig from '../../components/PlansConfig';
import {
  Button,
  Card,
  Checkbox,
  Heading,
  Information,
} from '../../components/ui';
import Switcher from '../../components/ui/Switcher';

import PageNotFound from '../404';
import { configDescription } from '../../config';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { Config } from '../../types';
import api from '../../utils/api';
import {
  getEnabledConfigs,
  getPreparedInputValue,
  getUpdatedArray,
  prepareConfigs,
} from '../../utils/config.utils';
import { __ } from '../../utils/helpers';
import { capitalizeFirstLetter } from '../../utils/learn.helpers';

const ConfigPage = () => {
  const { platform }: any = usePlatform();
  const myConfigs = platform.config.find();
  const filter = {};
  const allConfigCategories =
    myConfigs && myConfigs.toJS().map((config: any) => config.slug);
  const { user } = useAuth();

  const [selectedConfig, setSelectedConfig] = useState('general');
  const [updatedConfigs, setUpdatedConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfigUpdated, setHasConfigUpdated] = useState(false);
  const [enabledConfigs, setEnabledConfigs] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [platform, filter]);

  useEffect(() => {
    if (myConfigs) {
      const preparedConfigs = prepareConfigs(
        myConfigs.toJS(),
        configDescription,
      );
      setUpdatedConfigs(preparedConfigs);
      setEnabledConfigs(
        getEnabledConfigs(preparedConfigs, allConfigCategories),
      );
    }
  }, [myConfigs]);

  const loadData = async () => {
    try {
      platform.config.get();
    } catch (err) {
      console.log('Load error', err);
    }
  };

  const handleToggleConfig = (configCategory: string) => {
    let shouldEnable = false;
    if (enabledConfigs.includes(configCategory)) {
      setEnabledConfigs(
        enabledConfigs.filter((item: string) => item !== configCategory),
      );
      setSelectedConfig('general');
      shouldEnable = false;
    } else {
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
      setHasConfigUpdated(false);
      const res = await api.patch(`/config/${configCategoryToSave}`, {
        slug: configCategoryToSave,
        value: updatedConfig?.value,
      });

      if (res.status === 200) {
        setHasConfigUpdated(true);
        setTimeout(() => {
          setHasConfigUpdated(false);
        }, 2000);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
    key = '',
    index: null | number = null,
  ) => {
    const { name, value: inputValue } = event.target;

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
              name,
              preparedInputValue,
            );
            return {
              ...config,
              value: { ...config.value, [key]: updatedArray },
            };
          }

          return {
            ...config,
            value: { ...config.value, [name]: preparedInputValue },
          };
        }
        return config;
      }),
    ];
    setUpdatedConfigs(newConfigs);
  };

  const handleAddElement = () => {
    const defaultConfig = configDescription as any;
    const defaultPlan = defaultConfig.find(
      (config: any) => config.slug === selectedConfig,
    ).value.plans.default;

    const newConfigs = [
      ...updatedConfigs.map((config) => {
        if (config.slug === selectedConfig) {
          const plans: any = config.value.plans;
          const newPlans = [...plans, ...defaultPlan];
          return {
            ...config,
            value: { ...config.value, plans: newPlans },
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
          const plans: any = config.value.plans;
          const updatedPlans = plans.filter(
            (plan: any, idx: number) => idx !== index,
          );
          return {
            ...config,
            value: { ...config.value, plans: updatedPlans },
          };
        }
        return config;
      }),
    ];
    setUpdatedConfigs(newConfigs);
  };

  if (!user || !user.roles.includes('admin')) {
    return <PageNotFound error="User may not access" />;
  }

  return (
    <div>
      <Head>
        <title>{__('platform_configs')}</title>
      </Head>
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <Heading level={1}>{__('platform_configs')}</Heading>

        <Card>
          <Heading level={4}>{__('config_features_heading')}</Heading>
          <div className="flex flex-col md:flex-row gap-4">
            {allConfigCategories &&
              allConfigCategories.map((currentConfig: any) => {
                return (
                  <div key={currentConfig}>
                    <Checkbox
                      isEnabled={currentConfig !== 'general'}
                      id={currentConfig}
                      isChecked={enabledConfigs.includes(currentConfig)}
                      onChange={() => handleToggleConfig(currentConfig)}
                      className="mb-4"
                    >
                      {capitalizeFirstLetter(currentConfig)}
                    </Checkbox>
                  </div>
                );
              })}
          </div>
        </Card>

        <Switcher
          options={enabledConfigs}
          selectedOption={selectedConfig}
          setSelectedOption={setSelectedConfig}
        />

        <Card className="flex flex-col gap-10">
          {myConfigs &&
            updatedConfigs.map((config: Config) => {
              if (selectedConfig === config.slug) {
                return (
                  <div key={`${config.slug}`} className="flex flex-col gap-4">
                    <Heading level={2}>
                      {capitalizeFirstLetter(config.slug)}
                    </Heading>

                    {Object.entries(config.value).map(([key, value]) => {
                      const currentValue: string | number | boolean | any[] =
                        updatedConfigs.find(
                          (config) => config.slug === selectedConfig,
                        )?.value[key] ?? [];

                      const description = configDescription?.find(
                        (c) => c.slug === config.slug,
                      )?.value as Record<string, any>;
                      const inputType = description?.[key]?.type;
                      const isArray = Array.isArray(inputType);

                      return (
                        <>
                          {key !== 'enabled' && (
                            <div key={key} className="flex flex-col gap-1">
                              {!isArray && (
                                <label>{__(`config_label_${key}`)}:</label>
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
                                    {__('config_true')}
                                  </label>
                                  <label className="flex gap-1 items-center">
                                    <input
                                      type="radio"
                                      name={key}
                                      value="false"
                                      checked={currentValue === false}
                                      onChange={handleChange}
                                    />
                                    {__('config_false')}
                                  </label>
                                </div>
                              ) : (
                                <div>
                                  {isArray && (
                                    <div>
                                      <PlansConfig
                                        currentValue={currentValue}
                                        handleChange={handleChange}
                                        handleAddElement={handleAddElement}
                                        handleDeleteElement={
                                          handleDeleteElement
                                        }
                                        plansKey={key}
                                      />
                                    </div>
                                  )}
                                  {!isArray && (
                                    <input
                                      className="bg-neutral rounded-md p-1"
                                      name={key}
                                      onChange={handleChange}
                                      type="text"
                                      value={String(currentValue)}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })}
                  </div>
                );
              }
            })}
          <Button
            onClick={handleSaveConfig}
            isLoading={isLoading}
            isEnabled={!isLoading}
          >
            Save
          </Button>
          {hasConfigUpdated && <Information>Config updated!</Information>}
        </Card>
      </div>
    </div>
  );
};

export default ConfigPage;
