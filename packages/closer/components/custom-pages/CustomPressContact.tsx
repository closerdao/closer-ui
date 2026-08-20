import React from 'react';

import { useTranslations } from 'next-intl';

import { Heading } from '../ui';
import { resolveBlockText } from '../../utils/blockI18n';

interface Props {
  settings?: Record<string, unknown>;
  content?: {
    title?: string;
    description?: string;
    email?: string;
  };
}

const CustomPressContact = ({ content }: Props) => {
  const t = useTranslations();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const title = pick(content?.title, t('press_contact_title'));
  const description = pick(content?.description, t('press_contact_description'));
  const email =
    content?.email?.trim() || 'press@traditionaldreamfactory.com';

  return (
    <section className="bg-white py-24 md:py-32 border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-6 flex flex-col gap-4 text-center items-center">
        {title ? (
          <Heading
            level={2}
            className="text-2xl md:text-3xl font-normal text-gray-900 tracking-tight"
          >
            {title}
          </Heading>
        ) : null}
        {description ? (
          <p className="text-sm text-gray-700 leading-relaxed font-light">
            {description}
          </p>
        ) : null}
        {email ? (
          <a
            href={`mailto:${email}`}
            className="text-accent hover:text-accent-dark font-medium"
          >
            {email}
          </a>
        ) : null}
      </div>
    </section>
  );
};

export default CustomPressContact;
