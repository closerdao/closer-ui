import React from 'react';

import { useTranslations } from 'next-intl';

import { Heading, LinkButton } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    title?: string;
    description?: string;
    primaryText?: string;
    primaryLink?: string;
    secondaryText?: string;
    secondaryLink?: string;
  };
}

const CustomTeamJoinCta = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const title = pick(content?.title, t('team_join_title'));
  const description = pick(content?.description, t('team_join_desc'));
  const primaryText = pick(
    content?.primaryText,
    t('team_join_view_positions'),
  );
  const primaryLink = content?.primaryLink?.trim() || '/roles';
  const secondaryText = pick(
    content?.secondaryText,
    t('team_join_volunteer_program'),
  );
  const secondaryLink = content?.secondaryLink?.trim() || '/volunteer';

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto flex flex-col gap-4 text-center items-center">
        {title ? (
          <Heading level={2} className="font-serif text-3xl text-gray-900">
            {title}
          </Heading>
        ) : null}
        {description ? (
          <p className="text-gray-600">{description}</p>
        ) : null}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          {primaryText && primaryLink ? (
            <LinkButton href={primaryLink} variant="primary">
              {primaryText}
            </LinkButton>
          ) : null}
          {secondaryText && secondaryLink ? (
            <LinkButton href={secondaryLink} variant="secondary">
              {secondaryText}
            </LinkButton>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default CustomTeamJoinCta;
