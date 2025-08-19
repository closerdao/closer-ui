// App specific configs that are not directly editable by property admin in UI:
const config = {
  APP_NAME: 'tdf',
  DEFAULT_TIMEZONE: 'Europe/Lisbon',
  platformAllowedConfigs: [
    'booking',
    'general',
    'volunteering',
    'subscriptions',
    'booking-rules',
    'fundraiser',
    'payment',
    'emails',
    'learningHub',
    'citizenship',
    'affiliate',
    'rbac',
    'webinar',
    'newsletter',
  ],
  PORT: 14444,
  EXPOSE_STORE: true,
  CACHE_DURATION: 300000, // 5min
  LOGO_HEADER: '/images/logo.png',
  LOGO_FOOTER: '/images/logo.svg',
  PERMISSIONS: {
    event: {
      create: 'event-creator',
    },
  },
  TOKEN_PRICE: 230.23,
  SOURCE_TOKEN: 'CEUR',
  STAY_BOOKING_ALLOWED_PLANS: ['wanderer', 'pioneer', 'sheep'],
  MIN_INSTANT_BOOKING_ALLOWED_PLAN: 'wanderer',
  reviewsList: [
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
      copy: 'A special place with character. The charm of TDF is unique. Everything enchants you. You come out different. I will come back next year for sure!',
      photo: '/images/reviews/rim.jpg',
    },
    {
      screenname: 'Vinay',
      copy: 'Don’t come here. The community is way too kind. The nature is way too peaceful. The ideas are way too beautiful. It’ll ruin your life. But maybe that’s exactly what you’re looking for.',
      photo: '/images/reviews/vinay.png',
    },
    {
      screenname: 'Chavis',
      copy: 'I couldn’t stop thinking about TDF after my first visit. It was a rare sort of experience that left me genuinely inspired about the future. It might have been the very first time that climate change actually felt like a problem I was empowered to do something about. Great food, too.',
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
    },
  ],
};

export default config;
