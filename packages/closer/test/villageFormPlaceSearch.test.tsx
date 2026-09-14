import React from 'react';

import VillageForm from '../components/VillageForm';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GeocodeResult, searchPlaces } from '../utils/geocode.helpers';
import { renderWithNextIntl } from './utils';

type MapProps = { center?: [number, number]; zoom?: number };
let lastMapProps: MapProps = {};

// Leaflet needs a real viewport; what matters here is where the form points it.
jest.mock('../components/CommunityMap', () => ({
  __esModule: true,
  default: (props: MapProps) => {
    lastMapProps = props;
    return <div data-testid="community-map" />;
  },
}));

jest.mock('../utils/geocode.helpers', () => ({
  ...jest.requireActual('../utils/geocode.helpers'),
  searchPlaces: jest.fn(),
}));

jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
}));

const abela: GeocodeResult = {
  name: 'Abela',
  nameLong: 'Abela, Santiago do Cacém, Setúbal, Portugal',
  coordinates: [-8.4567, 38.0123],
  country: 'Portugal',
};

const labelled = (label: string) =>
  screen.getByText(label).closest('label')?.querySelector('input') as
    | HTMLInputElement
    | null;

const renderForm = () => {
  const onSubmit = jest.fn(() => Promise.resolve());
  renderWithNextIntl(
    <VillageForm submitLabel="Save village" onSubmit={onSubmit} />,
  );
  return onSubmit;
};

const searchFor = async (text: string) => {
  await userEvent.type(screen.getByLabelText('Find it by address'), text);
  await userEvent.click(screen.getByRole('button', { name: 'Search' }));
};

beforeEach(() => {
  lastMapProps = {};
  (searchPlaces as jest.Mock).mockReset();
  (searchPlaces as jest.Mock).mockResolvedValue([abela]);
});

describe('VillageForm address search', () => {
  it('drops the pin, recentres the map and fills the country from a result', async () => {
    renderForm();
    await searchFor('Abela');

    await userEvent.click(
      await screen.findByRole('option', { name: abela.nameLong }),
    );

    expect(labelled('Latitude *')).toHaveValue('38.01230');
    expect(labelled('Longitude *')).toHaveValue('-8.45670');
    expect(labelled('Country *')).toHaveValue('Portugal');
    expect(lastMapProps.center).toEqual([38.0123, -8.4567]);
    expect(lastMapProps.zoom).toBe(12);
    // The list closes once a result is taken.
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('keeps a country the founder already typed', async () => {
    renderForm();
    await userEvent.type(labelled('Country *') as HTMLInputElement, 'Spain');
    await searchFor('Abela');

    await userEvent.click(
      await screen.findByRole('option', { name: abela.nameLong }),
    );

    expect(labelled('Country *')).toHaveValue('Spain');
  });

  it('searches on Enter without submitting the village', async () => {
    const onSubmit = renderForm();
    await userEvent.type(
      screen.getByLabelText('Find it by address'),
      'Abela{enter}',
    );

    await screen.findByRole('option', { name: abela.nameLong });
    expect(searchPlaces).toHaveBeenCalledWith('Abela', expect.anything());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('says so when the lookup fails', async () => {
    (searchPlaces as jest.Mock).mockRejectedValue(new Error('boom'));
    renderForm();
    await searchFor('Abela');

    await waitFor(() =>
      expect(
        screen.getByText('Could not search places. Try again.'),
      ).toBeInTheDocument(),
    );
  });
});
