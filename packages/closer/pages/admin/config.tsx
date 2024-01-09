import Head from 'next/head';

import { ChangeEvent, useState } from 'react';

import { Button, Card, Heading, Information } from '../../components/ui';
import Switcher from '../../components/ui/Switcher';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { Config } from '../../types';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';
import { capitalizeFirstLetter } from '../../utils/learn.helpers';

interface Props {
  error?: string;
  configs: Config[];
}

const ConfigPage = ({ configs }: Props) => {
  const configTypes = configs
    .filter((config) => config.slug)
    .map((config) => config.slug);
  const { user } = useAuth();

  const [selectedConfig, setSelectedConfig] = useState(configs[0].slug);
  const [updatedConfigs, setUpdatedConfigs] = useState(configs);
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfigUpdated, setHasConfigUpdated] = useState(false);

  const handleSaveConfig = async () => {
    const updatedConfig = updatedConfigs.find(
      (config) => config.slug === selectedConfig,
    );
    try {
      setIsLoading(true);
      setHasConfigUpdated(false);
      const res = await api.patch(`/config/${selectedConfig}`, {
        slug: selectedConfig,
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

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    const booleanValue =
      value === 'true' ? true : value === 'false' ? false : value;

    setUpdatedConfigs([
      ...updatedConfigs.map((config) => {
        if (config.slug === selectedConfig) {
          return {
            ...config,
            value: {
              ...config.value,
              [name]: {
                ...config.value[name],
                value: booleanValue,
              },
            },
          };
        }
        return config;
      }),
    ]);
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

        <Switcher
          options={configTypes}
          selectedOption={selectedConfig}
          setSelectedOption={setSelectedConfig}
        />

        <Card className="flex flex-col gap-10">
          {configs.map((config) => {
            if (selectedConfig === config.slug) {
              return (
                <div key={config.slug} className="flex flex-col gap-4">
                  <Heading level={2}>
                    {capitalizeFirstLetter(config.slug)}
                  </Heading>

                  {Object.entries(config.value).map(([key, value]) => {
                    const currentValue =
                      updatedConfigs.find(
                        (config) => config.slug === selectedConfig,
                      )?.value[key]?.value ?? '';

                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <label>{value.label}:</label>
                        {typeof value.value === 'boolean' ? (
                          <div className="flex gap-3">
                            <label className="flex gap-1 items-center">
                              <input
                                type="radio"
                                name={key}
                                value="true"
                                checked={currentValue === true}
                                onChange={handleChange}
                              />
                              True
                            </label>
                            <label className="flex gap-1 items-center">
                              <input
                                type="radio"
                                name={key}
                                value="false"
                                checked={currentValue === false}
                                onChange={handleChange}
                              />
                              False
                            </label>
                          </div>
                        ) : (
                          <input
                            className="bg-neutral rounded-md p-1"
                            name={key}
                            onChange={handleChange}
                            type="text"
                            value={String(currentValue)}
                          />
                        )}
                      </div>
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

ConfigPage.getInitialProps = async () => {
  try {
    const configResponse = await api.get('/config');

    return {
      configs: configResponse?.data.results,
    };
  } catch (err: unknown) {
    console.log('err=', err);
  }
};

export default ConfigPage;
