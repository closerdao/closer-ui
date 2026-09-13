import { FC } from 'react';

import { FirstStepDefinition } from '../../../constants/firstSteps';
import ConfigFields from '../ConfigFields';
import SaveBar from '../SaveBar';

/**
 * The `general` fields the rest of setup reads: the village's name, where it
 * is, and how to reach it. These feed the `{{placeholder}}` interpolation that
 * fills the page templates in the pages step, which is why identity comes
 * first.
 */
export interface IdentityStepProps {
  step: FirstStepDefinition;
  value: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

const IdentityStep: FC<IdentityStepProps> = ({
  step,
  value,
  onChange,
  onSave,
  isSaving,
  isDirty,
}) => (
  <>
    <ConfigFields
      slug={step.fields!.slug}
      keys={step.fields!.keys}
      value={value}
      onChange={onChange}
      disabled={isSaving}
      platformName={value?.platformName}
    />
    <SaveBar onSave={onSave} isSaving={isSaving} isDirty={isDirty} />
  </>
);

export default IdentityStep;
