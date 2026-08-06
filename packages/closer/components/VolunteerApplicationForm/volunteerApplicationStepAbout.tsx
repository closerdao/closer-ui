import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import {
  VOLUNTEER_AGE_RANGES,
  VOLUNTEER_HEAR_ABOUT_US_OPTIONS,
} from '../../constants/volunteerApplication';
import type { VolunteerApplicationAbout } from '../../types/volunteerApplication';
import api from '../../utils/api';
import Heading from '../ui/Heading';
import MultiSelect from '../ui/Select/MultiSelect';
import {
  SelectField,
  TextField,
  YesNoField,
} from './volunteerApplicationFields';
import type { VolunteerApplicationErrors } from '../../utils/volunteerApplication.helpers';

interface Props {
  about: VolunteerApplicationAbout;
  onChange: (patch: Partial<VolunteerApplicationAbout>) => void;
  errors: VolunteerApplicationErrors;
  diet: string[];
  onDietChange: (diet: string[]) => void;
  dietOptions: string[];
}

const VolunteerApplicationStepAbout = ({
  about,
  onChange,
  errors,
  diet,
  onDietChange,
  dietOptions,
}: Props) => {
  const t = useTranslations();
  const [countries, setCountries] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/meta/countries')
      .then((res) => {
        if (cancelled) return;
        setCountries(
          (res.data?.results || []).map((country: any) => ({
            value: country.code,
            label: country.name,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setCountries([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label={t('volunteer_application_full_name')}
          value={about.fullName}
          onChange={(value) => onChange({ fullName: value })}
          error={errors.fullName}
          autoComplete="name"
          isRequired
        />
        <SelectField
          label={t('volunteer_application_nationality')}
          value={about.nationality}
          onChange={(value) => onChange({ nationality: value })}
          options={countries}
          placeholder={t('volunteer_application_select_placeholder')}
          error={errors.nationality}
          isRequired
        />
        <SelectField
          label={t('volunteer_application_age_range')}
          value={about.ageRange}
          onChange={(value) => onChange({ ageRange: value })}
          options={VOLUNTEER_AGE_RANGES.map((range) => ({
            value: range,
            label: range,
          }))}
          placeholder={t('volunteer_application_select_placeholder')}
          error={errors.ageRange}
          isRequired
        />
        <TextField
          label={t('volunteer_application_phone')}
          value={about.phone}
          onChange={(value) => onChange({ phone: value })}
          error={errors.phone}
          type="tel"
          placeholder="+351 900 000 000"
          autoComplete="tel"
          isRequired
        />
      </div>

      <section className="bg-neutral rounded-lg p-4 flex flex-col gap-4">
        <Heading level={4} className="!mt-0 text-base">
          {t('volunteer_application_emergency_contact_title')}
        </Heading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextField
            label={t('volunteer_application_emergency_contact_name')}
            value={about.emergencyContactName}
            onChange={(value) => onChange({ emergencyContactName: value })}
            error={errors.emergencyContactName}
            isRequired
          />
          <TextField
            label={t('volunteer_application_emergency_contact_phone')}
            value={about.emergencyContactPhone}
            onChange={(value) => onChange({ emergencyContactPhone: value })}
            error={errors.emergencyContactPhone}
            type="tel"
            placeholder="+351 900 000 000"
            isRequired
          />
          <TextField
            label={t('volunteer_application_emergency_contact_relationship')}
            value={about.emergencyContactRelationship}
            onChange={(value) =>
              onChange({ emergencyContactRelationship: value })
            }
            error={errors.emergencyContactRelationship}
            isRequired
          />
        </div>
      </section>

      <YesNoField
        label={t('volunteer_application_insurance')}
        value={about.hasInsurance}
        onChange={(value) => onChange({ hasInsurance: value })}
        error={errors.hasInsurance}
        yesLabel={t('volunteer_application_yes')}
        noLabel={t('volunteer_application_no')}
      />

      <div className="flex flex-col gap-2">
        <label className="font-medium text-complimentary-light">
          {t('volunteer_application_diet')}
        </label>
        <MultiSelect
          values={diet}
          onChange={(newDiet: string[]) => onDietChange(newDiet.filter(Boolean))}
          options={dietOptions}
          placeholder={t('volunteer_application_pick_or_create')}
        />
      </div>

      <div className="flex flex-col gap-4">
        <SelectField
          label={t('volunteer_application_hear_about_us')}
          value={about.hearAboutUs}
          onChange={(value) =>
            onChange({
              hearAboutUs: value,
              ...(value === 'other' ? {} : { hearAboutUsOther: '' }),
            })
          }
          options={VOLUNTEER_HEAR_ABOUT_US_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
          placeholder={t('volunteer_application_select_placeholder')}
          error={errors.hearAboutUs}
          isRequired
        />
        {about.hearAboutUs === 'other' && (
          <TextField
            label={t('volunteer_application_hear_about_us_other')}
            value={about.hearAboutUsOther}
            onChange={(value) => onChange({ hearAboutUsOther: value })}
            error={errors.hearAboutUsOther}
            isRequired
          />
        )}
      </div>
    </div>
  );
};

export default VolunteerApplicationStepAbout;
