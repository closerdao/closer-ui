import Link from 'next/link';

import { FC } from 'react';

import { Village, VillageMapItem } from '../../types/village';

type VillageCardProps = {
  village: Village | VillageMapItem;
  href?: string;
};

const VillageCard: FC<VillageCardProps> = ({ village, href }) => {
  const path =
    href ||
    (village.slug
      ? `/villages/${village.slug}`
      : village._id
        ? `/villages/${village._id}`
        : undefined);

  const content = (
    <article className="flex flex-col gap-2 py-4 border-b border-gray-200">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">{village.name}</h3>
        {village.closer ? (
          <span className="text-xs uppercase tracking-wide text-accent-foreground bg-accent/20 px-2 py-0.5 rounded">
            Closer
          </span>
        ) : null}
        {'verificationBadge' in village &&
        village.verificationBadge &&
        village.verificationBadge !== 'unverified' ? (
          <span className="text-xs uppercase tracking-wide text-foreground bg-gray-100 px-2 py-0.5 rounded">
            {village.verificationBadge}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-gray-600">{village.country}</p>
      <p className="text-sm text-gray-700 line-clamp-3">{village.description}</p>
      {village.tags?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {village.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded"
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
    <Link href={path} className="block hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
};

export default VillageCard;
