import { FEATURES, GOVERNANCE_URL } from '../config';

export const links = [
  {
    label: 'Booking requests',
    url: '/bookings/requests',
    enabled: () => FEATURES.booking,
    roles: ['space-host'],
  },
  {
    label: 'Check in',
    url: '/bookings/check-in',
    enabled: () => FEATURES.booking,
    roles: ['space-host'],
  },
  {
    label: 'Calendar availability',
    url: '/bookings/calendar',
    enabled: () => FEATURES.booking,
    roles: ['space-host'],
  },
  {
    label: 'Edit listings',
    url: '/listings',
    enabled: () => FEATURES.booking,
    roles: ['space-host'],
  },
  {
    label: 'Book a stay',
    url: '/bookings/create',
    enabled: () => FEATURES.booking,
  },
  {
    label: 'My bookings',
    url: '/bookings',
    enabled: () => FEATURES.booking,
  },
  {
    label: 'Settings',
    url: '/settings',
  },
  {
    label: 'Governance',
    url: GOVERNANCE_URL,
    target: '_blank',
    enabled: () => !!GOVERNANCE_URL,
    roles: ['member'],
  },
  {
    label: 'Admin',
    url: '/admin',
    roles: ['admin'],
  },
];
