import { useTranslations } from 'next-intl';

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
  const t = useTranslations();
  return (
    <Card>
      <Heading level={4}>{t('config_features_heading')}</Heading>
      <div className="flex flex-row gap-x-4 flex-wrap">
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
