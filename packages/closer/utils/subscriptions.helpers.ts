import { SubscriptionPlan, SubscriptionsConfig } from '../types/subscriptions';

export const isPaidSubscriptionPlan = (
  plan?: SubscriptionPlan | null,
): plan is SubscriptionPlan => {
  if (!plan) {
    return false;
  }

  const priceId = plan.priceId?.trim();
  if (!priceId || priceId === 'free') {
    return false;
  }

  if (plan.slug === 'citizen') {
    return false;
  }

  return true;
};

export const filterPaidSubscriptionPlans = (
  plans: SubscriptionPlan[] = [],
): SubscriptionPlan[] => plans.filter(isPaidSubscriptionPlan);

export const prepareSubscriptions = (
  subscriptionsConfig?: SubscriptionsConfig | null,
): SubscriptionPlan[] => {
  if (!subscriptionsConfig?.elements) {
    return [];
  }

  return subscriptionsConfig.elements;
};

export const getPaidSubscriptionPlans = (
  subscriptionsConfig?: SubscriptionsConfig | null,
  options?: { availableOnly?: boolean },
): SubscriptionPlan[] => {
  const plans = filterPaidSubscriptionPlans(
    prepareSubscriptions(subscriptionsConfig),
  );

  if (options?.availableOnly === false) {
    return plans;
  }

  return plans.filter((plan) => plan.available);
};

/** The bit of a user we need to work out their badge. */
export interface BadgeableSubscription {
  plan?: string;
  priceId?: string;
  validUntil?: Date | string;
}

/** A membership that passed `isSubscriptionActive`, so it names a plan and price. */
export interface ActiveSubscription extends BadgeableSubscription {
  plan: string;
  priceId: string;
}

/**
 * Whether the user is currently a paying member. Every user carries a
 * `subscription` object — the free tier included — so the mere presence of one,
 * or of a `priceId`, says nothing. A membership only counts when it names a
 * plan, is not the free tier, and has not run out. A cancelled membership still
 * counts until `validUntil` passes, which is what the member paid for.
 */
export const isSubscriptionActive = (
  subscription?: BadgeableSubscription | null,
): subscription is ActiveSubscription => {
  const priceId = subscription?.priceId?.trim();
  if (!subscription?.plan || !priceId || priceId === 'free') {
    return false;
  }

  return Boolean(
    subscription.validUntil && new Date(subscription.validUntil) > new Date(),
  );
};

export interface ResolvedSubscriptionBadge {
  /** Uploaded badge image. Null when the plan only has an emoji. */
  imageUrl: string | null;
  /** Emoji fallback, rendered when there is no image. */
  label: string;
  /** Plan name, used as the tooltip and for screen readers. */
  title: string;
}

/**
 * Resolves the badge shown next to a member's avatar from the subscriptions
 * config. Returns null whenever there is nothing to show, so callers can render
 * it unconditionally: badges turned off, no membership, an expired one, or a
 * plan the admin has left without a badge.
 */
export const resolveSubscriptionBadge = (
  subscription?: BadgeableSubscription | null,
  subscriptionsConfig?: SubscriptionsConfig | null,
): ResolvedSubscriptionBadge | null => {
  if (
    !subscriptionsConfig?.enabled ||
    subscriptionsConfig.showBadges === false
  ) {
    return null;
  }

  if (!isSubscriptionActive(subscription)) {
    return null;
  }

  const priceId = subscription.priceId.trim();
  const plan = prepareSubscriptions(subscriptionsConfig).find(
    (element) =>
      element.priceId === priceId ||
      element.priceId?.split(',').includes(priceId) ||
      element.slug === subscription.plan,
  );

  // `badge` is an uploaded image URL; `emoji` is what platforms configured
  // before badge images existed, so it stays as the fallback.
  const imageUrl = plan?.badge?.trim() || '';
  const label = plan?.emoji?.trim() || '';
  if (!imageUrl && !label) {
    return null;
  }

  return {
    imageUrl: imageUrl || null,
    label,
    title: plan?.title || subscription.plan,
  };
};

export const filterCitizenAndFreeFromElements = (
  elements: SubscriptionPlan[] = [],
): SubscriptionPlan[] =>
  elements.filter(
    (plan) =>
      plan?.slug !== 'citizen' && plan?.priceId !== 'free' && Boolean(plan),
  );
