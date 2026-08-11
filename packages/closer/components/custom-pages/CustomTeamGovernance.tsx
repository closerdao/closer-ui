import React from 'react';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Heading } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';

interface GovernanceItem {
  title: string;
  description: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    items?: GovernanceItem[];
    governsTitle?: string;
    governsItems?: string[];
  };
}

const CustomTeamGovernance = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const eyebrow = pick(content?.eyebrow, t('team_governance_label'));
  const title = pick(content?.title, t('team_tdf_dao_title'));
  const description = pick(content?.description, t('team_dao_desc'));
  const governsTitle = pick(content?.governsTitle, t('team_dao_governs_title'));

  const defaultItems: GovernanceItem[] = [
    {
      title: t('team_citizens_title'),
      description: t('team_citizens_desc'),
    },
    {
      title: t('team_citizen_assembly_title'),
      description: t('team_citizen_assembly_desc'),
    },
    {
      title: t('team_treasury_title'),
      description: t('team_treasury_desc'),
    },
    {
      title: t('team_token_holders_title'),
      description: t('team_token_holders_desc'),
    },
    {
      title: t('team_sweat_holders_title'),
      description: t('team_sweat_holders_desc'),
    },
    {
      title: t('team_presence_holders_title'),
      description: t('team_presence_holders_desc'),
    },
  ];

  const items =
    content?.items && content.items.length > 0
      ? content.items.map((item) => ({
          title: pick(item.title, item.title),
          description: pick(item.description, item.description),
        }))
      : defaultItems;

  const defaultGovernsItems = [
    t('team_dao_governs_game_guide'),
    t('team_dao_governs_land_plan'),
    t('team_dao_governs_elections'),
  ];

  const governsItems =
    content?.governsItems && content.governsItems.length > 0
      ? content.governsItems.map((item) => pick(item, item))
      : defaultGovernsItems;

  return (
    <section className="py-16 px-6 bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <span className="bg-accent text-gray-900 text-sm px-4 py-1 rounded-full font-medium self-start">
              {eyebrow}
            </span>
          ) : null}
          {title ? (
            <Heading level={2} className="font-serif text-3xl text-white">
              {title}
            </Heading>
          ) : null}
          {description ? (
            <p className="text-gray-400">{description}</p>
          ) : null}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="bg-gray-800 rounded-xl p-6 flex flex-col gap-2"
            >
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>

        {governsItems.length > 0 ? (
          <div className="p-6 bg-gray-800 rounded-xl flex flex-col gap-4">
            {governsTitle ? (
              <h3 className="font-semibold text-white">{governsTitle}</h3>
            ) : null}
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {governsItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default CustomTeamGovernance;
