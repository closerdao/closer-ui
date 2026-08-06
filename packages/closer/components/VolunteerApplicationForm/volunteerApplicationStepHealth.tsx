import { useTranslations } from 'next-intl';

import { VOLUNTEER_HEALTH_RETENTION_DAYS } from '../../constants/volunteerApplication';
import type { VolunteerApplicationHealth } from '../../types/volunteerApplication';
import type { VolunteerApplicationErrors } from '../../utils/volunteerApplication.helpers';
import Checkbox from '../ui/Checkbox';
import { TextAreaField, YesNoField } from './volunteerApplicationFields';

interface Props {
  health: VolunteerApplicationHealth;
  onChange: (patch: Partial<VolunteerApplicationHealth>) => void;
  errors: VolunteerApplicationErrors;
}

const VolunteerApplicationStepHealth = ({
  health,
  onChange,
  errors,
}: Props) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <p className="bg-accent-light text-accent rounded-lg p-4 text-sm leading-relaxed">
        {t('volunteer_application_health_intro')}
      </p>

      <div className="flex flex-col gap-4">
        <YesNoField
          label={t('volunteer_application_physical_conditions')}
          value={health.hasPhysicalConditions}
          onChange={(value) => onChange({ hasPhysicalConditions: value })}
          error={errors.hasPhysicalConditions}
          yesLabel={t('volunteer_application_yes')}
          noLabel={t('volunteer_application_no')}
        />
        {health.hasPhysicalConditions === 'yes' && (
          <TextAreaField
            label={t('volunteer_application_please_describe')}
            value={health.physicalConditionsDetails}
            onChange={(value) => onChange({ physicalConditionsDetails: value })}
            error={errors.physicalConditionsDetails}
            isRequired
          />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <YesNoField
          label={t('volunteer_application_mental_health')}
          value={health.isTreatedForMentalHealth}
          onChange={(value) => onChange({ isTreatedForMentalHealth: value })}
          error={errors.isTreatedForMentalHealth}
          yesLabel={t('volunteer_application_yes')}
          noLabel={t('volunteer_application_no')}
        />
        {health.isTreatedForMentalHealth === 'yes' && (
          <TextAreaField
            label={t('volunteer_application_please_describe')}
            value={health.mentalHealthDetails}
            onChange={(value) => onChange({ mentalHealthDetails: value })}
            error={errors.mentalHealthDetails}
            isRequired
          />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <YesNoField
          label={t('volunteer_application_medication')}
          value={health.takesMedication}
          onChange={(value) => onChange({ takesMedication: value })}
          error={errors.takesMedication}
          yesLabel={t('volunteer_application_yes')}
          noLabel={t('volunteer_application_no')}
        />
        {health.takesMedication === 'yes' && (
          <TextAreaField
            label={t('volunteer_application_please_list')}
            value={health.medicationDetails}
            onChange={(value) => onChange({ medicationDetails: value })}
            error={errors.medicationDetails}
            hint={t('volunteer_application_medication_note')}
            isRequired
          />
        )}
      </div>

      <TextAreaField
        label={t('volunteer_application_allergies')}
        value={health.allergies}
        onChange={(value) => onChange({ allergies: value })}
        error={errors.allergies}
        placeholder={t('volunteer_application_allergies_placeholder')}
        isRequired
      />

      <div className="bg-neutral rounded-lg p-4">
        <Checkbox
          id="volunteer-health-consent"
          isChecked={Boolean(health.consentedAt)}
          onChange={(event: any) =>
            onChange({
              consentedAt: event.target.checked
                ? new Date().toISOString()
                : undefined,
            })
          }
        >
          <span className="text-sm font-normal">
            {t('volunteer_application_health_consent', {
              days: VOLUNTEER_HEALTH_RETENTION_DAYS,
            })}
          </span>
        </Checkbox>
        {errors.consentedAt && (
          <p className="text-error text-sm" role="alert">
            {errors.consentedAt}
          </p>
        )}
      </div>
    </div>
  );
};

export default VolunteerApplicationStepHealth;
