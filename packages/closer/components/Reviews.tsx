import Image from 'next/image';

import { useEffect, useState } from 'react';

import { useConfig } from '../hooks/useConfig';
import { Review } from '../types/review';
import { __ } from '../utils/helpers';
import Heading from './ui/Heading';

const Reviews = () => {
  // TODO: move reviews to config
  const { reviewsList } = useConfig();
  const [activeReviews, setReviewsList] = useState<Review[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !reviewsList) return;

    setReviewsList(reviewsList?.sort(() => Math.random() - 0.5));
  }, [reviewsList]);

  return (
    <>
      {activeReviews && (
        <div className="mb-6 max-w-prose">
          <Heading level={2} className="text-3xl mb-6 italic">
            <blockquote>
              <span className="text-6xl">&quot;</span>
              {__('stay_reviews_title')}
            </blockquote>
          </Heading>
          <div className="grid md:grid-cols-1 gap-x-3 md:gap-x-3 gap-y-12">
            {activeReviews.slice(0, 3).map((review) => (
              <div
                className="flex flex-col md:flex-row items-center"
                key={review.screenname}
              >
                <div>
                  <div className="w-[100px] ml-4">
                    <Image
                      src={review.photo}
                      alt={review.copy}
                      width={100}
                      height={100}
                      className="w-[100px] h-[100px] rounded-full"
                    />
                  </div>
                </div>
                <div className="ml-0 md:ml-4 mt-4 md:mt-0 max-w-prose p-3">
                  <p className="text-xl md:text-2xl font-bold">
                    {review.screenname}
                  </p>
                  <p className="text-lg md:text-xl italic">{review.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Reviews;
