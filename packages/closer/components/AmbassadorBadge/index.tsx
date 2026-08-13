import { FC } from 'react';

import RoleTag, { RoleTagSize } from '../RoleTag';

type AmbassadorBadgeProps = {
  className?: string;
  size?: RoleTagSize;
};

/**
 * Ambassadors get their own entry point because the badge is shown for
 * affiliates too, who do not carry the `ambassador` role. The chip itself is
 * the shared role tag, so it stays in step with the rest of them.
 */
const AmbassadorBadge: FC<AmbassadorBadgeProps> = ({
  className = '',
  size = 'sm',
}) => <RoleTag role="ambassador" size={size} className={className} />;

export default AmbassadorBadge;
