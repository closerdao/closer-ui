export const links = [
  {
    label: 'Subscriptions',
    url: '/subscriptions',
    enabled: process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true',
  },
  {
    label: 'Events',
    url: '/events',
    enabled: true,
  },
  {
    label: 'Volunteer',
    url: '/volunteer',
    enabled: true,
  },
  {
    label: 'Booking requests',
    url: '/bookings/requests',
    enabled: process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true',
    roles: ['space-host'],
  },
  {
    label: 'Edit listings',
    url: '/listings',
    enabled: process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true',
    roles: ['space-host'],
  },
  {
    label: 'Book a stay',
    url: '/listings',
    enabled: process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true',
  },
  {
    label: '$TDF token',
    url: '/token',
    enabled: process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true',
  },
  {
    label: 'My bookings',
    url: '/bookings',
    enabled: process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true',
  },
  {
    label: 'Refer a friend',
    url: '/settings/referrals',
    enabled: true,
  },
  {
    label: 'Governance',
    url: 'https://snapshot.org/#/traditionaldreamfactory.eth',
    target: '_blank',
    enabled: true,
    roles: ['member'],
  },
  {
    label: 'User list',
    url: '/admin/manage-users',
    enabled: true,
    roles: ['admin'],
  },
  {
    label: 'New event',
    url: '/events/create',
    enabled: true,
    roles: ['event-creator'],
  },
  {
    label: 'New volunteer',
    url: '/volunteer/create',
    enabled: true,
    roles: ['steward'],
  },
  {
    label: 'Resources',
    url: '/resources',
    enabled: true,
  },
];
