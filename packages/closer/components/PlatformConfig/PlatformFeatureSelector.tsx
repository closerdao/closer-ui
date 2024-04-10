import React from 'react';

import { __ } from '../../utils/helpers';
import { capitalizeFirstLetter } from '../../utils/learn.helpers';
import { Card, Checkbox, Heading } from '../ui';

const NON_EDITABLE_FEATURES = ['general'];

interface Props {
  enabledConfigs: string[];
  allConfigCategories: string[];
  handleToggleConfig: (config: string) => void;
}

const PlatformFeatureSelector = ({
  enabledConfigs,
  allConfigCategories,
  handleToggleConfig,
}: Props) => {
  return (
    <Card>
      <Heading level={4}>{__('config_features_heading')}</Heading>
      <div className="flex flex-col md:flex-row gap-4">
        {allConfigCategories
          .filter((category) => !NON_EDITABLE_FEATURES.includes(category))
          .map((currentConfig: any) => {
            return (
              <div key={currentConfig}>
                <Checkbox
                  id={currentConfig}
                  isChecked={
                    enabledConfigs && enabledConfigs?.includes(currentConfig)
                  }
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
  );
};

export default PlatformFeatureSelector;
