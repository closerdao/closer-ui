import Link from 'next/link';

import { FC } from 'react';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '../ui';

/**
 * The way back into `/first-steps` from the dashboard.
 *
 * An admin is sent to the wizard once, automatically, and never again — so
 * after that this banner is how they find it. It reads from derived progress,
 * which means it reappears if somebody later clears a setting the site needs.
 * That is deliberate, and it is also why it stays dismissible: honest is not
 * the same as nagging.
 */

export interface FirstStepsBannerProps {
  doneCount: number;
  total: number;
  onDismiss: () => void;
}

const FirstStepsBanner: FC<FirstStepsBannerProps> = ({
  doneCount,
  total,
  onDismiss,
}) => {
  const t = useTranslations();

  return (
    <aside
      className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md bg-accent-light p-4"
      data-testid="first-steps-banner"
    >
      <div>
        <p className="font-bold">{t('first_steps_banner_title')}</p>
        <p className="text-sm">
          {t('first_steps_banner_body', { done: doneCount, total })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/first-steps">
          <Button size="small" isFullWidth={false}>
            {t('first_steps_banner_cta')}
          </Button>
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          title={t('first_steps_banner_dismiss')}
          aria-label={t('first_steps_banner_dismiss')}
        >
          <X size={18} />
        </button>
      </div>
    </aside>
  );
};

export default FirstStepsBanner;
