import React from 'react';

import { useTranslations } from 'next-intl';

import { Heading } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';

interface Partner {
  name: string;
  role: string;
}

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    partners?: Partner[];
  };
}

const DEFAULT_PARTNERS: Partner[] = [
  { name: 'Coin Finance', role: 'Token & Web3' },
  { name: 'Lars Schlichting', role: 'Legal' },
  { name: 'CRU Architecture', role: 'Architecture' },
  { name: 'SCARD', role: 'Engineering' },
  { name: 'White Rabbit', role: 'Development' },
  { name: 'Kinterra', role: 'Regenerative systems sourcing' },
  { name: 'TBD Construction', role: 'Construction' },
  { name: 'CAAC Accounting', role: 'Accounting' },
  { name: 'Start PME', role: 'Grant Support' },
  { name: 'Fieldfisher Law', role: 'Legal (PT)' },
  { name: 'Crédito Agrícola', role: 'Banking' },
];

const CustomTeamPartners = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const eyebrow = pick(content?.eyebrow, t('team_partners_label'));
  const title = pick(content?.title, t('team_partners_title'));
  const description = pick(content?.description, t('team_partners_desc'));

  const partners =
    content?.partners && content.partners.length > 0
      ? content.partners.map((partner) => ({
          name: pick(partner.name, partner.name),
          role: pick(partner.role, partner.role),
        }))
      : DEFAULT_PARTNERS;

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <span className="bg-gray-100 text-gray-800 text-sm px-4 py-1 rounded-full font-medium self-start">
              {eyebrow}
            </span>
          ) : null}
          {title ? (
            <Heading level={2} className="font-serif text-3xl text-gray-900">
              {title}
            </Heading>
          ) : null}
          {description ? (
            <p className="text-gray-600">{description}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {partners.map((partner, index) => (
            <div
              key={`${partner.name}-${index}`}
              className="p-4 bg-gray-50 rounded-xl text-center flex flex-col gap-1"
            >
              <p className="font-medium text-sm text-gray-900">{partner.name}</p>
              <p className="text-xs text-gray-500">{partner.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomTeamPartners;
