import { useTranslations } from 'next-intl';

import { useConfig } from '../../hooks/useConfig';
import { Heading, Textarea } from '../ui';

interface Props {
  updateApplication: (key: string, value: any) => void;
  application: any;
  buyMore?: boolean;
}

const CitizenWhy = ({ updateApplication, application }: Props) => {
  const t = useTranslations();
  const config = useConfig() || {};
  const LOGO_HEADER = config.LOGO_HEADER ?? '';
  const PLATFORM_NAME = config.PLATFORM_NAME ?? '';

  const reasons = [
    {
      title: t('subscriptions_citizen_reason_home_title'),
      description: t('subscriptions_citizen_reason_home_description'),
    },
    {
      title: t('subscriptions_citizen_reason_voice_title'),
      description: t('subscriptions_citizen_reason_voice_description'),
    },
    {
      title: t('subscriptions_citizen_reason_stake_title'),
      description: t('subscriptions_citizen_reason_stake_description'),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        {LOGO_HEADER && (
          <img
            src={LOGO_HEADER}
            alt={PLATFORM_NAME}
            className="mx-auto mb-6 h-20 w-20 rounded-2xl border border-gray-200 bg-white object-contain p-2"
          />
        )}
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          {t('subscriptions_citizen_hero_kicker')}
        </p>
        <Heading level={2} className="mx-auto mt-3 mb-4 max-w-xl">
          {t('subscriptions_citizen_hero_title')}
        </Heading>
        <p className="mx-auto max-w-lg leading-relaxed text-gray-600">
          {t('subscriptions_citizen_good_to_go_intro')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {reasons.map((reason) => (
          <div
            key={reason.title}
            className="rounded-xl border border-gray-200 bg-accent-light/40 p-4 text-sm leading-snug"
          >
            <b className="mb-1 block">{reason.title}</b>
            {reason.description}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="why" className="block text-sm font-bold">
          {t('subscriptions_citizen_good_why')}{' '}
          <span className="text-xs font-semibold text-accent">
            *{t('subscriptions_citizen_hero_required')}
          </span>
        </label>
        <Textarea
          id="why"
          className="min-h-[88px] rounded-xl"
          value={application?.why || ''}
          onChange={(e) => updateApplication('why', e.target.value)}
          placeholder={t('subscriptions_citizen_hero_why_placeholder')}
        />
      </div>
    </div>
  );
};

export default CitizenWhy;
