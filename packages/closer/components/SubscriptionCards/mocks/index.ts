export const config = {
  SUBSCRIPTIONS: {
    config: {
      currency: 'EUR',
      symbol: '€',
    },
    plans: [
      {
        title: 'Wanderer',
        emoji: '👩🏽‍🌾',
        description: 'Unlock yor stay passes and join our physical community',
        priceId: 'price_1MqtoHGtt5D0VKR2Has7KE5X',
        slug: 'wanderer',
        tier: 1,
        monthlyCredits: 3,
        price: 10,
        available: true,
        tiersAvailable: false,
        perks: [
          ' ✔ Access to Events',
          ' ✔ Access to Volunteering',
          '✔ Weekly newsletter',
          '🌟 Free E-Book',
          '🌟 Discord Community Access',
          '🌟 10% Discount on accommodation',
        ],
        billingPeriod: 'month',
      },

      {
        title: 'Pioneer',
        emoji: '👨🏽‍🚀',
        description:
          'Collect carrots and turn them into stay and event credits',
        priceId: 'price_1Mqtp0Gtt5D0VKR297NwmzIy',
        slug: 'pioneer',
        tier: 2,
        monthlyCredits: 20,
        price: 30,
        available: true,
        tiersAvailable: false,
        perks: [
          ' ✔ Access to Events',
          '✔ Access to Volunteering',
          ' ✔ Weekly newsletter',
          ' ✔ Free E-Book',
          ' ✔ Discord Community Access',
          '✔ Impact Reports',
          '🌟 Access To Stays',
          '🌟 20% Discount on accommodation',
        ],
        billingPeriod: 'month',
      },
    ],
  },
};

export default config;
