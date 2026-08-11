import { SubscriptionsConfig } from '../../types/subscriptions';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import {
  BadgeableSubscription,
  resolveSubscriptionBadge,
} from '../../utils/subscriptions.helpers';

interface SubscriptionBadgeProps {
  subscription?: BadgeableSubscription | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizes = {
  small: 'h-4 text-xs',
  medium: 'h-5 text-sm',
  large: 'h-8 text-2xl',
};

/**
 * The member's plan badge, shown next to their name. Renders nothing unless the
 * subscriptions config gives their plan a badge, so it is safe to drop next to
 * any name.
 */
const SubscriptionBadge = ({
  subscription,
  size = 'small',
  className = '',
}: SubscriptionBadgeProps) => {
  const subscriptionsConfig = getCachedConfig('subscriptions') as
    | SubscriptionsConfig
    | null;
  const badge = resolveSubscriptionBadge(subscription, subscriptionsConfig);

  if (!badge) {
    return null;
  }

  const shared = `${sizes[size]} inline-flex items-center align-middle ml-1 shrink-0 ${className}`;

  if (badge.imageUrl) {
    return (
      <img
        src={badge.imageUrl}
        alt={badge.title}
        title={badge.title}
        className={`${shared} w-auto object-contain`}
      />
    );
  }

  return (
    <span title={badge.title} aria-label={badge.title} className={shared}>
      {badge.label}
    </span>
  );
};

export default SubscriptionBadge;
