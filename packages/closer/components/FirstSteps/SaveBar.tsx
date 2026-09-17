import { FC } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '../ui';

/**
 * One save affordance, shared by every step that writes config, so "did that
 * save?" always has the same answer in the same place.
 */
export interface SaveBarProps {
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  /** Overrides the default "Save" label. */
  labelKey?: string;
}

const SaveBar: FC<SaveBarProps> = ({
  onSave,
  isSaving,
  isDirty,
  labelKey = 'first_steps_save',
}) => {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-3">
      <Button
        size="small"
        isFullWidth={false}
        isEnabled={isDirty && !isSaving}
        isLoading={isSaving}
        onClick={onSave}
        dataTestid="first-steps-save"
      >
        {t(labelKey)}
      </Button>
      {!isDirty && !isSaving && (
        <span className="text-sm text-foreground/60">
          {t('first_steps_saved')}
        </span>
      )}
    </div>
  );
};

export default SaveBar;
