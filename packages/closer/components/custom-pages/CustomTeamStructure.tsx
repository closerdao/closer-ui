import React from 'react';

import { Landmark, type LucideIcon, Users, Vote, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Heading } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';

interface TeamStructureItem {
  icon?: string;
  title: string;
  description: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    eyebrow?: string;
    title?: string;
    items?: TeamStructureItem[];
  };
}

const ICON_MAP: Record<string, LucideIcon> = {
  landmark: Landmark,
  vote: Vote,
  zap: Zap,
  users: Users,
};

const resolveIcon = (icon?: string): LucideIcon => {
  if (!icon) return Users;
  return ICON_MAP[icon.toLowerCase()] ?? Users;
};

const CustomTeamStructure = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const eyebrow = content?.eyebrow?.trim()
    ? resolveBlockText(content.eyebrow, t)
    : '';
  const title = content?.title?.trim()
    ? resolveBlockText(content.title, t)
    : '';

  const defaultItems: TeamStructureItem[] = [
    {
      icon: 'landmark',
      title: t('team_oasa_association_title'),
      description: t('team_oasa_association_desc'),
    },
    {
      icon: 'vote',
      title: t('team_tdf_dao_title'),
      description: t('team_tdf_dao_desc'),
    },
    {
      icon: 'zap',
      title: t('team_executive_team_title'),
      description: t('team_executive_team_desc'),
    },
  ];

  const items =
    content?.items && content.items.length > 0
      ? content.items.map((item) => ({
          icon: item.icon,
          title: pick(item.title, item.title),
          description: pick(item.description, item.description),
        }))
      : defaultItems;

  return (
    <section className="py-12 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {(eyebrow || title) && (
          <div className="flex flex-col gap-2 text-center">
            {eyebrow ? (
              <span className="bg-accent text-gray-800 text-sm px-4 py-1 rounded-full font-medium self-center">
                {eyebrow}
              </span>
            ) : null}
            {title ? (
              <Heading level={2} className="font-serif text-3xl text-gray-900">
                {title}
              </Heading>
            ) : null}
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {items.map((item, index) => {
            const Icon = resolveIcon(item.icon);
            return (
              <div key={`${item.title}-${index}`} className="p-6 flex flex-col gap-4 items-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                  <Icon className="w-7 h-7 text-gray-800" />
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CustomTeamStructure;
