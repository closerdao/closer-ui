import { useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { SubscriptionPlan } from '../../types/subscriptions';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { Button, ErrorMessage, Heading, Spinner } from '../ui';

interface SubscriptionManageCardProps {
  activePlan?: SubscriptionPlan;
  planTitleFallback?: string;
  price?: number;
  currency: string;
  validUntil: Date | null;
  isCancelled: boolean;
  /** The plan they pay for is no longer offered — see useActiveSubscription. */
  isOnDeprecatedPlan?: boolean;
  /** The plan is still sold, but at a different price than they pay. */
  isOnLegacyPricing?: boolean;
  isBusy: boolean;
  error: string | null;
  otherPlans: SubscriptionPlan[];
  onChangePlan: (plan: SubscriptionPlan) => void | Promise<unknown>;
  onCancel: () => void | Promise<unknown>;
  onResume: () => void | Promise<unknown>;
  onDismissError: () => void;
}

// Formatted with dayjs rather than toLocaleDateString: the latter picks up the
// server's locale during SSR and the browser's on the client, which hydrates
// into a text mismatch.
const formatDate = (date: Date | null) =>
  date ? dayjs(date).format('D MMMM YYYY') : '';

const SubscriptionManageCard = ({
  activePlan,
  planTitleFallback,
  price,
  currency,
  validUntil,
  isCancelled,
  isOnDeprecatedPlan = false,
  isOnLegacyPricing = false,
  isBusy,
  error,
  otherPlans,
  onChangePlan,
  onCancel,
  onResume,
  onDismissError,
}: SubscriptionManageCardProps) => {
  const t = useTranslations();
  const [isChoosingPlan, setIsChoosingPlan] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const title = activePlan?.title || planTitleFallback || '';
  // What the member is actually billed. Normally the plan and the subscription
  // agree; on legacy pricing they do not, and the subscription is the truth.
  const amount = isOnLegacyPricing
    ? price ?? activePlan?.price
    : activePlan?.price ?? price;
  const renewalDate = formatDate(validUntil);
  const currentPlanPrice =
    isOnLegacyPricing && typeof activePlan?.price === 'number'
      ? formatIsoFiatAmount(Number(activePlan.price), currency)
      : '';

  const closePanels = () => {
    setIsChoosingPlan(false);
    setIsConfirmingCancel(false);
    onDismissError();
  };

  // Collapse the panel once the action has run. Any failure is reported by the
  // error message above, which stays visible after the panel closes.
  const handleCancel = async () => {
    await onCancel();
    setIsConfirmingCancel(false);
  };

  const handleChangePlan = async (plan: SubscriptionPlan) => {
    await onChangePlan(plan);
    setIsChoosingPlan(false);
  };

  return (
    <section className="bg-neutral-light rounded-2xl border border-line p-5 md:p-7 text-foreground flex flex-col gap-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex-1 flex flex-col gap-2">
          <span className="inline-flex w-fit rounded-full bg-accent-light px-3 py-1 text-xs font-semibold">
            {t('subscriptions_your_membership_badge')}
          </span>
          <Heading level={2} className="text-2xl md:text-3xl">
            {activePlan?.emoji ? `${activePlan.emoji} ` : ''}
            {title}
          </Heading>
          {renewalDate ? (
            <p className="text-sm text-foreground/75">
              {isCancelled
                ? t('subscriptions_ends_on', { date: renewalDate })
                : t('subscriptions_renews_on', { date: renewalDate })}
            </p>
          ) : null}
        </div>

        {typeof amount === 'number' ? (
          <div className="flex flex-col items-start md:items-end">
            <p className="text-3xl md:text-4xl font-semibold leading-none">
              {formatIsoFiatAmount(Number(amount || 0), currency)}
            </p>
            <p className="text-sm text-foreground/70">
              {t('subscriptions_summary_per_month')}
            </p>
          </div>
        ) : null}
      </div>

      {isOnDeprecatedPlan ? (
        <div
          role="status"
          className="rounded-xl border border-line bg-accent-light p-4 flex flex-col gap-3"
        >
          <p className="font-semibold">
            {t('subscriptions_deprecated_title')}
          </p>
          <p className="text-sm">{t('subscriptions_deprecated_intro')}</p>
          {otherPlans.length > 0 && !isChoosingPlan ? (
            <Button
              size="small"
              isFullWidth={false}
              isEnabled={!isBusy}
              onClick={() => setIsChoosingPlan(true)}
            >
              {t('subscriptions_deprecated_migrate_button')}
            </Button>
          ) : null}
        </div>
      ) : null}

      {isOnLegacyPricing && activePlan ? (
        <div
          role="status"
          className="rounded-xl border border-line bg-neutral p-4 flex flex-col gap-3"
        >
          <p className="font-semibold">
            {t('subscriptions_legacy_pricing_title')}
          </p>
          <p className="text-sm">
            {currentPlanPrice
              ? t('subscriptions_legacy_pricing_intro_priced', {
                  price: currentPlanPrice,
                })
              : t('subscriptions_legacy_pricing_intro')}
          </p>
          <Button
            size="small"
            variant="secondary"
            isFullWidth={false}
            isEnabled={!isBusy}
            onClick={() => onChangePlan(activePlan)}
          >
            {t('subscriptions_legacy_pricing_button')}
          </Button>
        </div>
      ) : null}

      {error ? (
        <div role="alert">
          <ErrorMessage error={error} />
        </div>
      ) : null}

      {isBusy ? (
        <div className="flex items-center gap-3 text-sm text-foreground/75">
          <Spinner />
          {t('subscriptions_updating')}
        </div>
      ) : null}

      {!isChoosingPlan && !isConfirmingCancel ? (
        <div className="flex flex-wrap gap-3">
          {isCancelled ? (
            <>
              <Button
                size="small"
                isFullWidth={false}
                isEnabled={!isBusy}
                onClick={onResume}
              >
                {t('subscriptions_resume_button')}
              </Button>
              {/* A cancelled member still has access until the end of the
                  period, so switching plan is a real option — not only
                  resuming the one they just left. On a retired plan the
                  notice above already offers this, so it is not repeated. */}
              {otherPlans.length > 0 && !isOnDeprecatedPlan ? (
                <Button
                  size="small"
                  variant="secondary"
                  isFullWidth={false}
                  isEnabled={!isBusy}
                  onClick={() => setIsChoosingPlan(true)}
                >
                  {t('subscriptions_change_plan_button')}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              {otherPlans.length > 0 && !isOnDeprecatedPlan ? (
                <Button
                  size="small"
                  isFullWidth={false}
                  isEnabled={!isBusy}
                  onClick={() => setIsChoosingPlan(true)}
                >
                  {t('subscriptions_change_plan_button')}
                </Button>
              ) : null}
              <Button
                size="small"
                variant="secondary"
                isFullWidth={false}
                isEnabled={!isBusy}
                onClick={() => setIsConfirmingCancel(true)}
              >
                {t('subscriptions_cancel_button')}
              </Button>
            </>
          )}
        </div>
      ) : null}

      {isChoosingPlan ? (
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <p className="font-semibold">
            {t('subscriptions_change_plan_title')}
          </p>
          <p className="text-sm text-foreground/75">
            {t('subscriptions_change_plan_intro')}
          </p>
          <ul className="flex flex-col gap-3">
            {otherPlans.map((plan) => (
              <li
                key={plan.slug}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-neutral p-4"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {plan.emoji ? `${plan.emoji} ` : ''}
                    {plan.title}
                  </span>
                  <span className="text-sm text-foreground/70">
                    {formatIsoFiatAmount(Number(plan.price || 0), currency)}{' '}
                    {t('subscriptions_summary_per_month')}
                  </span>
                </div>
                <Button
                  size="small"
                  isFullWidth={false}
                  isEnabled={!isBusy}
                  onClick={() => handleChangePlan(plan)}
                >
                  {typeof amount === 'number' && Number(plan.price) > amount
                    ? t('subscriptions_switch_upgrade_button')
                    : t('subscriptions_switch_button')}
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-sm text-foreground/70">
            {t('subscriptions_change_plan_proration_note')}
          </p>
          <button
            className="text-sm underline w-fit"
            onClick={closePanels}
            disabled={isBusy}
          >
            {t('generic_cancel')}
          </button>
        </div>
      ) : null}

      {isConfirmingCancel ? (
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <p className="font-semibold">{t('subscriptions_cancel_title')}</p>
          <p className="text-sm text-foreground/75">
            {renewalDate
              ? t('subscriptions_cancel_confirm_dated', { date: renewalDate })
              : t('subscriptions_cancel_confirm')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="small"
              variant="secondary"
              isFullWidth={false}
              isEnabled={!isBusy}
              onClick={handleCancel}
            >
              {t('subscriptions_cancel_confirm_button')}
            </Button>
            <Button
              size="small"
              isFullWidth={false}
              isEnabled={!isBusy}
              onClick={closePanels}
            >
              {t('subscriptions_keep_button')}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default SubscriptionManageCard;
