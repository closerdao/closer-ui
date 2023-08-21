import Image from 'next/image';

import { useState } from 'react';

import { Review } from '../../types/subscriptions';
import { Heading } from '../ui';

interface Props {
  reviews: Review[];
}

const Reviews = ({ reviews }: Props) => {
  const [selectedReview, setSelectedReview] = useState(1);
  return (
    <div className="p-6 pb-24 ">
      {reviews.map((review, i) => {
        return (
          <div
            key={review.name}
            className={`flex flex-col sm:flex-row p-6 gap-6 ${
              selectedReview - 1 === i ? 'block' : 'hidden'
            }  `}
          >
            <Image
              src={review.photo}
              alt={`testimonial-${i}`}
              width={60}
              height={60}
              className="w-[60px] h-[60px]"
            />
            <div className="w-full sm:w-3/4">
              <div className="w-full flex items-center gap-2 mb-2">
                <Heading level={3} className="min-w-[60px]">
                  {review.name}
                </Heading>
                <ul className="flex ">
                  {[...Array(5).keys()].map((i) => {
                    const rating = i + 1;
                    return (
                      <li key={i}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className={`mr-1 h-5 w-5 ${
                            review.rating >= rating
                              ? 'text-accent'
                              : 'text-disabled'
                          }
                            
                              `}
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p className="min-h-[100px]">{`“${review.text}”`}</p>
            </div>
          </div>
        );
      })}
      <div className="flex items-center h-4 justify-center">
        <div className="flex items-center space-between w-1/3 ">
          {reviews.map((review, i) => (
            <div
              onClick={() => setSelectedReview(i + 1)}
              key={review.name}
              className={`flex-1 cursor-pointer h-1.5 rounded-full mr-1 ${
                i === selectedReview - 1 ? 'bg-accent' : 'bg-neutral-dark '
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
