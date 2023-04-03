export const links = [
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
    url: '/bookings/create',
    enabled: process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true',
  },
  {
    label: 'My bookings',
    url: '/bookings',
    enabled: process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true',
  },
  {
    label: 'Settings',
    url: '/settings',
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
    label: 'Admin',
    url: '/admin',
    enabled: true,
    roles: ['admin'],
  },
  {
    label: 'Subscriptions',
    url: '/subscriptions',
    enabled: true,
  },
];
