import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { capitalizeFirstLetter } from '../../utils/learn.helpers';

const NON_EDITABLE_FEATURES = ['general'];
const BETA_FEATURES = ['community', 'governance'];

interface Props {
  enabledConfigs: string[];
  allConfigCategories: string[];
  selectedConfig: string;
  handleToggleConfig: (config: string) => void;
  onSelectConfig: (config: string) => void;
}

const PlatformFeatureSelector = ({
  enabledConfigs,
  allConfigCategories,
  selectedConfig,
  handleToggleConfig,
  onSelectConfig,
}: Props) => {
  const t = useTranslations();

  const features = allConfigCategories.filter(
    (category) => !NON_EDITABLE_FEATURES.includes(category),
  );

  return (
    <div className="flex flex-col gap-1">
      {features.map((feature) => {
        const isEnabled = enabledConfigs?.includes(feature);
        const isSelected = selectedConfig === feature;

        return (
          <div
            key={feature}
            className={`rounded-lg border transition-colors ${
              isEnabled
                ? isSelected
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-200 bg-white'
                : 'border-gray-100 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 p-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleConfig(feature);
                }}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  isEnabled ? 'bg-accent' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    isEnabled ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>

              <button
                onClick={() => {
                  if (isEnabled) {
                    onSelectConfig(feature);
                  }
                }}
                disabled={!isEnabled}
                className={`flex-1 flex items-center justify-between text-left ${
                  isEnabled
                    ? 'text-gray-900 cursor-pointer'
                    : 'text-gray-400 cursor-default'
                }`}
              >
                <span className="text-sm font-medium">
                  {capitalizeFirstLetter(feature)}
                  {BETA_FEATURES.includes(feature) && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                      Beta
                    </span>
                  )}
                </span>
                {isEnabled && (
                  <span className="text-gray-400">
                    {isSelected ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                )}
              </button>
            </div>

            {!isEnabled && (
              <p className="px-3 pb-3 text-xs text-gray-400">
                {t('config_feature_disabled')}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PlatformFeatureSelector;
