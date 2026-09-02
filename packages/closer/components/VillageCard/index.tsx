import Link from 'next/link';

import { FC } from 'react';

import { Village, VillageMapItem } from '../../types/village';
import { CloserPill, VerificationPill, VillageStatusPill } from '../VillageUI';

type VillageCardProps = {
  village: Village | VillageMapItem;
  href?: string;
  /** Managers see where the village sits on the Tier 0 → Tier 1 path. */
  showStatus?: boolean;
};

const VillageCard: FC<VillageCardProps> = ({
  village,
  href,
  showStatus = false,
}) => {
  const path =
    href ||
    (village.slug
      ? `/villages/${village.slug}`
      : village._id
      ? `/villages/${village._id}`
      : undefined);

  const verificationBadge =
    'verificationBadge' in village ? village.verificationBadge : undefined;

  const content = (
    <article className="h-full flex flex-col bg-background border border-accent-medium rounded-[18px] p-6 transition-all group-hover:border-accent group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_32px_theme(colors.accent/12%)]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {village.closer ? <CloserPill /> : null}
        <VerificationPill badge={verificationBadge} />
        {showStatus ? (
          <VillageStatusPill status={village.onboardingStatus} />
        ) : null}
      </div>

      <h3 className="font-serif text-xl leading-tight text-foreground">
        {village.name}
      </h3>
      <p className="text-[12.5px] uppercase tracking-[0.12em] text-foreground/70 mt-1.5">
        {village.country}
      </p>
      <p className="text-[14.5px] text-foreground/70 leading-relaxed mt-3 line-clamp-3">
        {village.description}
      </p>

      {village.tags?.length ? (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-5">
          {village.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[11.5px] text-foreground/70 bg-accent-light/40 border border-neutral-dark px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );

  if (!path) return content;

  return (
    <Link href={path} className="group block h-full">
      {content}
    </Link>
  );
};

export default VillageCard;
