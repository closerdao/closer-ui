import { FC } from 'react';

import { useTranslations } from 'next-intl';

type AmbassadorBadgeProps = {
  className?: string;
  size?: 'sm' | 'md';
};

const AmbassadorBadge: FC<AmbassadorBadgeProps> = ({
  className = '',
  size = 'sm',
}) => {
  const t = useTranslations();
  const sizeClass =
    size === 'md' ? 'text-[12.5px] px-3.5 py-1.5' : 'text-[11px] px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#C2F0DA] bg-[#E2FAEE] font-semibold uppercase tracking-[0.1em] text-[#0B7A4C] ${sizeClass} ${className}`}
    >
      <span className="text-[#0FA968]">✦</span>
      {t('ambassadors_badge_label')}
    </span>
  );
};

export default AmbassadorBadge;
