import Link from 'next/link';

import { FC } from 'react';

import { Check, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  StandardPageDefinition,
  editorHrefForPage,
} from '../../../constants/standardPages';
import { PageListItem } from '../../../utils/standardPages';
import { Button } from '../../ui';

/**
 * Every enabled feature ships with a page already written for it. This turns
 * those templates into real pages.
 *
 * Until a standard page is saved it exists only as a `std:` virtual id — the
 * editor renders it, but a visitor gets nothing. Creating it here seeds the
 * shipped defaults, interpolated with the identity captured in the first step,
 * so a village's site is never blank while they get around to writing copy.
 */

export interface PagesStepRow {
  definition: StandardPageDefinition;
  page?: PageListItem;
  isCreated: boolean;
}

export interface PagesStepProps {
  rows: PagesStepRow[];
  onCreate: (slug: string) => void;
  creatingSlug?: string | null;
}

const PagesStep: FC<PagesStepProps> = ({ rows, onCreate, creatingSlug }) => {
  const t = useTranslations();

  if (rows.length === 0) {
    return <p>{t('first_steps_pages_none')}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map(({ definition, page, isCreated }) => (
        <li
          key={definition.slug}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-dark p-4"
        >
          <div>
            <p className="font-bold">{t(definition.titleKey)}</p>
            <p className="font-mono text-xs text-foreground/60">
              {definition.slug}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isCreated ? (
              <span className="flex items-center gap-1.5 text-sm">
                <Check size={14} /> {t('first_steps_pages_created')}
              </span>
            ) : (
              <Button
                size="small"
                isFullWidth={false}
                isEnabled={!creatingSlug}
                isLoading={creatingSlug === definition.slug}
                dataTestid={`first-steps-create-page-${definition.key}`}
                onClick={() => onCreate(definition.slug)}
              >
                {t('first_steps_pages_create')}
              </Button>
            )}

            {page && (
              <Link
                href={editorHrefForPage(page)}
                className="flex items-center gap-1.5 text-sm underline"
              >
                {t('first_steps_pages_edit')}
                <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default PagesStep;
