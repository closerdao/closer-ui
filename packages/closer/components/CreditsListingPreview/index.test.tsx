import { fromJS } from 'immutable';

import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import CreditsListingPreview, { pickCreditExampleListing } from './index';

let listings: any[] = [];
const get = jest.fn(() => Promise.resolve(undefined));

jest.mock('../../contexts/platform', () => ({
  usePlatform: () => ({
    platform: {
      listing: {
        get,
        find: () => (listings.length ? fromJS(listings) : undefined),
      },
    },
  }),
}));

const listing = (overrides: Record<string, unknown> = {}) => ({
  _id: 'l1',
  name: 'Shared glamping',
  fiatPrice: { val: 50, cur: 'EUR' },
  ...overrides,
});

describe('pickCreditExampleListing', () => {
  it('picks the cheapest bookable listing', () => {
    const picked = pickCreditExampleListing([
      listing({ _id: 'suite', name: 'Suite', fiatPrice: { val: 120 } }),
      listing({ _id: 'shared', name: 'Shared glamping', fiatPrice: { val: 50 } }),
    ] as any);

    expect(picked?.name).toBe('Shared glamping');
  });

  it('skips listings a member cannot book', () => {
    const picked = pickCreditExampleListing([
      listing({ _id: 'team', name: 'Team room', availableFor: ['team'] }),
      listing({
        _id: 'volunteer',
        name: 'Volunteer tent',
        availableFor: 'volunteer',
        fiatPrice: { val: 10 },
      }),
      listing({ _id: 'guest', name: 'Bell tent', fiatPrice: { val: 80 } }),
    ] as any);

    expect(picked?.name).toBe('Bell tent');
  });

  it('skips listings with no nightly price to strike through', () => {
    expect(
      pickCreditExampleListing([
        listing({ fiatPrice: { val: 0 } }),
        listing({ _id: 'no-price', fiatPrice: undefined }),
      ] as any),
    ).toBeNull();
  });
});

describe('CreditsListingPreview', () => {
  beforeEach(() => {
    listings = [listing()];
  });

  it('says what the credits are worth against a real listing', () => {
    renderWithNextIntl(<CreditsListingPreview credits={14} />);

    expect(screen.getByText('14 nights in Shared glamping')).toBeInTheDocument();
    // 14 x €50, struck through, next to what the member actually pays.
    expect(screen.getByText('€700.00')).toBeInTheDocument();
    expect(screen.getByText('€0.00')).toBeInTheDocument();
  });

  it('falls back to plain nights when there is nothing to price against', () => {
    listings = [];

    renderWithNextIntl(<CreditsListingPreview credits={14} />);

    expect(
      screen.getByText('= 14 nights of accommodation'),
    ).toBeInTheDocument();
  });
});
