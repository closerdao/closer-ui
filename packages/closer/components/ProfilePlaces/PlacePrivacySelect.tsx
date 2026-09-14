import React from 'react';

import { useTranslations } from 'next-intl';

import { PlacePrivacy } from '../../types/userPlaces';
import { PLACE_PRIVACY_OPTIONS } from '../../utils/userPlaces.helpers';
import Select from '../ui/Select/Dropdown';

type PlacePrivacySelectProps = {
  value: PlacePrivacy;
  onChange: (value: PlacePrivacy) => void;
  className?: string;
  showLabel?: boolean;
};

const PlacePrivacySelect = ({
  value,
  onChange,
  className,
  showLabel = true,
}: PlacePrivacySelectProps) => {
  const t = useTranslations();

  return (
    <Select
      label={showLabel ? t('profile_places_privacy_label') : undefined}
      value={value}
      className={className}
      options={PLACE_PRIVACY_OPTIONS.map((option) => ({
        value: option,
        label: t(`profile_places_privacy_${option}`),
      }))}
      onChange={(next) => onChange(next as PlacePrivacy)}
    />
  );
};

export default PlacePrivacySelect;
