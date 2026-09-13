import React, { ReactNode } from 'react';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PlacePrivacy } from '../../types/userPlaces';
import { Button } from '../ui';
import PlacePrivacySelect from './PlacePrivacySelect';

type PlaceComposerProps = {
  title: string;
  visibility: PlacePrivacy;
  onVisibilityChange: (visibility: PlacePrivacy) => void;
  onAdd: () => void;
  error?: string | null;
  children: ReactNode;
};

/**
 * Adding a place is one composer, not a run of loose fields: the panel keeps
 * the search, whatever details the section needs, the privacy choice and the
 * Add action inside a single bordered element, so it reads as one thing sitting
 * below the list rather than as a continuation of it.
 */
const PlaceComposer = ({
  title,
  visibility,
  onVisibilityChange,
  onAdd,
  error,
  children,
}: PlaceComposerProps) => {
  const t = useTranslations();

  return (
    <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent-light/40 p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <p className="font-medium">{title}</p>
      </div>

      <div className="mt-4 flex flex-col gap-4">{children}</div>

      <div className="mt-4 flex flex-col gap-3 border-t border-accent/20 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-56">
          <PlacePrivacySelect
            value={visibility}
            onChange={onVisibilityChange}
          />
        </div>
        <Button
          onClick={onAdd}
          size="small"
          isFullWidth={false}
          className="sm:min-h-[42px]"
        >
          {t('generic_add')}
        </Button>
      </div>

      {error && <p className="validation-error mt-3">{error}</p>}
    </div>
  );
};

export default PlaceComposer;
