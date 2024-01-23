import { useState, useEffect } from 'react';
import Image from 'next/image';

import Heading from '../components/ui/Heading';
import { Review } from '../types/review';
import { __ } from '../utils/helpers';

const reviewsList = [
  {
    screenname: 'Daria',
    copy: `TDF…
It feels like a healing sanctuary in connection with nature, 
A pioneer in the space of innovation and sustainable living,
A meeting point for the most interesting deep thinkers, change-makers and rebels,
A playground for the kids in all of us that never want to grow up,
A place for dreamers to see and create their soul missions. 
And most of all, TDF feels like HOME for anyone, who puts the values of freedom, living in integrity and in community first to their hearts.`,
    photo: '/images/reviews/daria.jpg',
  },
  {
    screenname: 'Charlotte',
    copy: 'One of my favorite eco-village projects out there!',
    photo: '/images/reviews/charlotte.png',
  },
  {
    screenname: 'Kyle',
    copy: 'A place for bohemian makers, the intersection of Permaculture and crypto. My kind of place.',
    photo: '/images/reviews/kyle.png',
  },
  {
    screenname: 'Rim',
    copy: 'A special place with character. The charm of TDF is unique. Everything enchants you. You come out different. I will come back next year for sure!',
    photo: '/images/reviews/rim.jpg',
  },
  {
    screenname: 'Vinay',
    copy: 'Don\'t come here. The community is way too kind. The nature is way too peaceful. The ideas are way too beautiful. It\'ll ruin your life. But maybe that\'s exactly what you\'re looking for.',
    photo: '/images/reviews/vinay.png',
  },
  {
    screenname: 'Chavis',
    copy: 'I couldn\'t stop thinking about TDF after my first visit. It was a rare sort of experience that left me genuinely inspired about the future. It might have been the very first time that climate change actually felt like a problem I was empowered to do something about. Great food, too.',
    photo: '/images/reviews/chavis.jpg',
  },
  {
    screenname: 'Marcelina',
    copy: 'I joined TDF for couple of weeks last fall and it was truly great experience! Initially, I was facilitating movement sessions during one of the events and later decided to stay and volunteer for the project. I believe In the vision of this place and I am sure there is huge potential for growth and development. The truth is that we are facing a global shift at the moment and TDF is one of the places and tangible projects that can support the transformation.',
    photo: '/images/reviews/marcelina.png',
  },
  {
    screenname: 'Elizabeth',
    copy: 'My time at Traditional Dream Factory was a life-changing experience, and the people I met there will hold a special place in my heart forever.',
    photo: '/images/reviews/elizabeth.jpg',
  }
];

interface Props {
  reviews: Array<Review>
}

const Reviews = ({ reviews }: Props) => {
  const [activeReviews, setReviewsList] = useState(reviews);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setReviewsList(reviewsList.sort(() => (Math.random() - 0.5)));
  }, [reviews]);

  return (
    <div className="mb-6 max-w-prose">
      <Heading level={2} className="text-3xl mb-6 italic">
        <blockquote>
          <span className="text-6xl">&quot;</span>
          {__('stay_reviews_title')}
        </blockquote>
      </Heading>
      <div className="grid md:grid-cols-1 gap-x-3 md:gap-x-3 gap-y-12">
        {activeReviews && activeReviews.slice(0, 3).map((review) => (
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
              <p className="text-xl md:text-2xl font-bold">{review.screenname}</p>
              <p className="text-lg md:text-xl italic">{review.copy}</p>
            </div>
          </div>
        )
        )}
        {/* {activeReviews && (
          <Link
            href="/reviews"
            className="bold underline ml-[100px] px-12"
            onClick={(e) => {
              e.preventDefault();
              setReviewsList(activeReviews.sort(() => (Math.random() - 0.5)));
              console.log('clicked', activeReviews.sort(() => (Math.random() - 0.5)));
            }}
          >
            See more reviews
          </Link>
        )} */}
      </div>
    </div>
  );
};

Reviews.defaultProps = {
  reviews: reviewsList.sort(() => (Math.random() - 0.5))
};

export default Reviews;
