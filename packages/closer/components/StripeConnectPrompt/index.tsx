import { useTranslations } from 'next-intl';

import Heading from '../ui/Heading';

interface StripeConnectPromptProps {
  authorizeHref: string;
  onSkip?: () => void;
}

const StripeConnectPrompt = ({
  authorizeHref,
  onSkip,
}: StripeConnectPromptProps) => {
  const t = useTranslations();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-8">
      <Heading level={2}>{t('stripe_connect_title')}</Heading>
      <div className="flex flex-col gap-3">
        <p className="text-sm">{t('stripe_connect_description')}</p>
        <p className="text-sm">{t('stripe_connect_cta_detail')}</p>
      </div>
      <a
        href={authorizeHref || undefined}
        className={
          authorizeHref
            ? 'inline-flex w-fit rounded-full border-2 border-accent bg-accent px-6 py-2 text-center text-lg uppercase tracking-wide text-white'
            : 'pointer-events-none inline-flex w-fit rounded-full border-2 border-disabled bg-neutral px-6 py-2 text-center text-lg uppercase tracking-wide text-disabled'
        }
      >
        {t('stripe_connect_button')}
      </a>
      {onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          className="w-fit text-sm underline"
        >
          {t('stripe_connect_skip')}
        </button>
      ) : null}
    </div>
  );
};

export default StripeConnectPrompt;
