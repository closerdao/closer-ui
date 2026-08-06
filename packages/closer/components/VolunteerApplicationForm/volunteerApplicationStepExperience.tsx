import { useTranslations } from 'next-intl';

import type { VolunteerApplicationExperience } from '../../types/volunteerApplication';
import type { VolunteerApplicationErrors } from '../../utils/volunteerApplication.helpers';
import MultiSelect from '../ui/Select/MultiSelect';
import {
  TextAreaField,
  TextField,
  YesNoField,
} from './volunteerApplicationFields';

interface Props {
  experience: VolunteerApplicationExperience;
  onChange: (patch: Partial<VolunteerApplicationExperience>) => void;
  errors: VolunteerApplicationErrors;
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
  skillOptions: string[];
  platformName: string;
}

const VolunteerApplicationStepExperience = ({
  experience,
  onChange,
  errors,
  skills,
  onSkillsChange,
  skillOptions,
  platformName,
}: Props) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <YesNoField
          label={t('volunteer_application_volunteered_before', {
            platform: platformName,
          })}
          value={experience.hasVolunteeredBefore}
          onChange={(value) => onChange({ hasVolunteeredBefore: value })}
          error={errors.hasVolunteeredBefore}
          yesLabel={t('volunteer_application_yes')}
          noLabel={t('volunteer_application_no')}
        />
        {experience.hasVolunteeredBefore === 'yes' && (
          <TextField
            label={t('volunteer_application_previous_stay')}
            value={experience.previousStay}
            onChange={(value) => onChange({ previousStay: value })}
            error={errors.previousStay}
            placeholder={t('volunteer_application_previous_stay_placeholder')}
            isRequired
          />
        )}
      </div>

      <TextAreaField
        label={t('volunteer_application_hoping_to_gain')}
        value={experience.hopingToGain}
        onChange={(value) => onChange({ hopingToGain: value })}
        error={errors.hopingToGain}
        isRequired
      />
      <TextAreaField
        label={t('volunteer_application_challenges')}
        value={experience.anticipatedChallenges}
        onChange={(value) => onChange({ anticipatedChallenges: value })}
        error={errors.anticipatedChallenges}
        isRequired
      />
      <TextAreaField
        label={t('volunteer_application_self_care')}
        value={experience.selfCarePractices}
        onChange={(value) => onChange({ selfCarePractices: value })}
        error={errors.selfCarePractices}
        isRequired
      />

      <div className="flex flex-col gap-2">
        <label className="font-medium text-complimentary-light">
          {t('projects_skills_and_qualifications_title')}
        </label>
        <p className="text-sm text-complimentary-light">
          {t('projects_skills_and_qualifications_intro')}
        </p>
        <MultiSelect
          values={skills}
          onChange={(newSkills: string[]) =>
            onSkillsChange(newSkills.filter(Boolean))
          }
          options={skillOptions}
          placeholder={t('volunteer_application_pick_or_create')}
        />
      </div>
    </div>
  );
};

export default VolunteerApplicationStepExperience;
