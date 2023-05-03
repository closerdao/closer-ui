export const subscriptions = {

      config: {
        currency: 'EUR',
        symbol: '€',
      },
      plans: [
        {
          title: 'Explorer',
          emoji: '🕵🏽‍♀️',
          description: 'Optional subscription plan description',
          priceId: 'free',
          tier: 1,
          monthlyCredits: 0,
          price: 0,
          perks: [
            ' ✔ Access to Events',
            ' ✔ Access to Volunteering',
            ' ✔ Weekly newsletter',
          ],
          billingPeriod: 'month',
        },
        {
          title: 'Wanderer',
          emoji: '👩🏽‍🌾',
          description: 'Unlock yor stay passes and join our physical community',
          priceId: 'price_1MqtoHGtt5D0VKR2Has7KE5X',
          tier: 2,
          monthlyCredits: 3,
          price: 10,
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
          tier: 3,
          monthlyCredits: 20,
          price: 30,
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
      ] ,
    } 

  
  export default subscriptions;
  