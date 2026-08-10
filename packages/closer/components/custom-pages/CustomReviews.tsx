import React from 'react';

import { useTranslations } from 'next-intl';

import type { Review } from '../../types/review';
import { resolveBlockText } from '../../utils/blockI18n';
import Reviews, { DEFAULT_REVIEWS_LIST } from '../Reviews';

const toReview = (item: Record<string, unknown>): Review | null => {
  const name = String(item.name ?? item.screenname ?? '').trim();
  const content = String(item.content ?? item.copy ?? '').trim();
  const photo = String(item.photo ?? item.imageUrl ?? '').trim();
  if (!name && !content) return null;
  return {
    screenname: name,
    copy: content,
    photo,
  };
};

const CustomReviews: React.FC<{
  settings?: Record<string, unknown>;
  content?: Record<string, unknown>;
}> = ({ settings, content }) => {
  const t = useTranslations();
  const rawItems = Array.isArray(content?.items) ? content.items : [];
  const reviews = rawItems
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === 'object' && !Array.isArray(item)),
    )
    .map(toReview)
    .filter((item): item is Review => Boolean(item));

  const title =
    content?.title != null && String(content.title).trim()
      ? resolveBlockText(String(content.title), t)
      : undefined;
  const shuffle = settings?.shuffle !== false;
  const limitRaw = Number(settings?.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 3;

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reviews
          title={title}
          reviews={reviews.length > 0 ? reviews : DEFAULT_REVIEWS_LIST}
          shuffle={shuffle}
          limit={limit}
        />
      </div>
    </section>
  );
};

export default CustomReviews;
