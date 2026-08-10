import Image from 'next/image';

import { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Review } from '../types/review';
import { resolveBlockText } from '../utils/blockI18n';
import Heading from './ui/Heading';

export const DEFAULT_REVIEWS_LIST: Review[] = [
  {
    screenname: 'Daria',
    copy: `TDF feels like a healing sanctuary in connection with nature — a meeting point for deep thinkers, change-makers and rebels. Most of all, it feels like home.`,
    photo: '/images/reviews/daria.jpg',
  },
  {
    screenname: 'Charlotte',
    copy: 'One of my favorite ecovillage projects out there!',
    photo: '/images/reviews/charlotte.png',
  },
  {
    screenname: 'Kyle',
    copy: 'A place for bohemian makers, the intersection of Permaculture and crypto. My kind of place.',
    photo: '/images/reviews/kyle.png',
  },
  {
    screenname: 'Rim',
    copy: 'A special place with character. Everything enchants you. You come out different — I will come back next year for sure.',
    photo: '/images/reviews/rim.jpg',
  },
  {
    screenname: 'Vinay',
    copy: "Don't come here. The community is way too kind. The nature is way too peaceful. It'll ruin your life. But maybe that's exactly what you're looking for.",
    photo: '/images/reviews/vinay.png',
  },
  {
    screenname: 'Chavis',
    copy: 'I couldn\'t stop thinking about TDF after my first visit. It left me genuinely inspired about the future — and the food was great, too.',
    photo: '/images/reviews/chavis.jpg',
  },
  {
    screenname: 'Marcelina',
    copy: 'I volunteered for a couple of weeks last fall and it was a truly great experience. I believe in the vision of this place.',
    photo: '/images/reviews/marcelina.png',
  },
  {
    screenname: 'Elizabeth',
    copy: 'My time at Traditional Dream Factory was a life-changing experience, and the people I met there will hold a special place in my heart forever.',
    photo: '/images/reviews/elizabeth.jpg',
  },
];

interface ReviewsProps {
  title?: string;
  reviews?: Review[];
  shuffle?: boolean;
  limit?: number;
}

const Reviews = ({
  title,
  reviews,
  shuffle = true,
  limit = 3,
}: ReviewsProps) => {
  const t = useTranslations();
  const sourceReviews = useMemo(
    () => (reviews && reviews.length > 0 ? reviews : DEFAULT_REVIEWS_LIST),
    [reviews],
  );
  const [activeReviews, setReviewsList] = useState<Review[]>(
    shuffle ? [] : sourceReviews,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!shuffle) {
      setReviewsList(sourceReviews);
      return;
    }
    setReviewsList([...sourceReviews].sort(() => Math.random() - 0.5));
  }, [sourceReviews, shuffle]);

  const heading = resolveBlockText(title || '_i18n_stay_reviews_title', t);

  if (!activeReviews.length) {
    return null;
  }

  const visible = activeReviews.slice(0, limit);

  return (
    <div className="w-full flex flex-col items-center gap-10 md:gap-14">
      <header className="max-w-2xl mx-auto text-center flex flex-col gap-3 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {t('stay_reviews_eyebrow')}
        </p>
        <Heading
          level={2}
          display
          className="text-3xl md:text-4xl font-normal leading-snug text-foreground"
        >
          {heading}
        </Heading>
      </header>

      <div
        className={`w-full grid grid-cols-1 gap-12 md:gap-10 ${
          visible.length === 1
            ? 'md:grid-cols-1 max-w-xl mx-auto'
            : visible.length === 2
              ? 'md:grid-cols-2 max-w-4xl mx-auto'
              : 'md:grid-cols-3 max-w-6xl mx-auto'
        }`}
      >
        {visible.map((review) => {
          const name = resolveBlockText(review.screenname, t);
          const copy = resolveBlockText(review.copy, t);
          return (
            <figure
              key={`${review.screenname}-${review.photo}`}
              className="flex flex-col items-center text-center gap-5"
            >
              {review.photo ? (
                <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
                  <Image
                    src={review.photo}
                    alt={name}
                    fill
                    sizes="96px"
                    className="rounded-full object-cover"
                  />
                </div>
              ) : null}
              <blockquote className="relative text-lg md:text-xl leading-relaxed text-complimentary-light italic max-w-sm">
                <span
                  aria-hidden
                  className="absolute -top-3 -left-2 md:-left-4 text-4xl md:text-5xl leading-none text-accent not-italic select-none"
                >
                  &ldquo;
                </span>
                {copy}
              </blockquote>
              <figcaption className="text-sm font-semibold tracking-wide text-foreground">
                {name}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
};

export default Reviews;
