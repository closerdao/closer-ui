import React from 'react';

import VillageForm from '../components/VillageForm';

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CreateVillageInput, Village } from '../types/village';
import { renderWithNextIntl } from './utils';

// Leaflet needs a real viewport; the map is not what this test is about.
jest.mock('../components/CommunityMap', () => ({
  __esModule: true,
  default: () => <div data-testid="community-map" />,
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "./api" the utils import.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
}));

const village = (overrides: Partial<Village> = {}): Partial<Village> => ({
  _id: 'v1',
  slug: 'riverbank',
  name: 'Riverbank',
  description: 'A regenerative village on the Douro.',
  country: 'Portugal',
  coords: [-8.61, 41.15],
  status: 'planning',
  tags: [],
  onboardingStatus: 'subscribed',
  ...overrides,
});

const labelled = (label: string) =>
  screen.getByText(label).closest('label')?.querySelector('input, textarea') as
    | HTMLInputElement
    | HTMLTextAreaElement;

const statusSelect = () =>
  screen
    .getByText('Onboarding stage')
    .closest('label')
    ?.querySelector('select') as HTMLSelectElement;

const slugInput = () => labelled('Slug') as HTMLInputElement;

const renderForm = (initial: Partial<Village>) => {
  const onSubmit = jest.fn<Promise<void>, [CreateVillageInput]>(() =>
    Promise.resolve(),
  );
  renderWithNextIntl(
    <VillageForm
      initial={initial}
      submitLabel="Save village"
      onSubmit={onSubmit}
      isAdmin
      isReviewer
    />,
  );
  return onSubmit;
};

const submit = async () =>
  userEvent.click(screen.getByRole('button', { name: 'Save village' }));

describe('VillageForm slug freezing follows the pending status', () => {
  it.each(['failed', 'live', 'suspended'])(
    'freezes the slug the moment an admin picks %s',
    async (status) => {
      const onSubmit = renderForm(village());

      expect(slugInput()).not.toHaveAttribute('readonly');

      await userEvent.selectOptions(statusSelect(), status);

      expect(slugInput()).toHaveAttribute('readonly');
      expect(slugInput()).toBeDisabled();

      await submit();

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      const payload = onSubmit.mock.calls[0][0];
      expect(payload.onboardingStatus).toBe(status);
      expect(payload).not.toHaveProperty('slug');
    },
  );

  it('still sends the slug while the pending status leaves it editable', async () => {
    const onSubmit = renderForm(village());

    await userEvent.selectOptions(statusSelect(), 'intro_scheduled');
    expect(slugInput()).not.toHaveAttribute('readonly');

    await submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ slug: 'riverbank' });
  });
});

describe('VillageForm onboarding stage menu', () => {
  const optionValues = () =>
    Array.from(statusSelect().querySelectorAll('option')).map(
      (option) => option.value,
    );

  it('offers the deploy outcomes on an unmanaged village', () => {
    renderForm(village());

    expect(optionValues()).toEqual(
      expect.arrayContaining(['failed', 'live', 'suspended']),
    );
    expect(statusSelect()).toBeEnabled();
  });

  it('withholds the deploy outcomes on a managed village', () => {
    renderForm(village({ managed: true }));

    expect(optionValues()).not.toEqual(
      expect.arrayContaining(['failed', 'live', 'suspended']),
    );
    expect(optionValues()).toEqual(
      expect.arrayContaining(['map_only', 'subscribed']),
    );
  });

  it('never offers the in-flight stages, managed or not', () => {
    renderForm(village());

    expect(optionValues()).not.toEqual(
      expect.arrayContaining(['deploy_requested']),
    );
    expect(optionValues()).not.toEqual(expect.arrayContaining(['deploying']));
  });

  it('locks the stage a managed village is already at when procurement owns it', () => {
    renderForm(village({ managed: true, onboardingStatus: 'live' }));

    expect(statusSelect()).toBeDisabled();
    expect(statusSelect()).toHaveValue('live');
    expect(
      within(
        screen.getByText('Onboarding stage').closest('label') as HTMLElement,
      ).getByText(/owned by procurement/i),
    ).toBeInTheDocument();
  });

  it('locks the stage while a deploy is in flight', () => {
    renderForm(village({ onboardingStatus: 'deploying' }));

    expect(statusSelect()).toBeDisabled();
    expect(statusSelect()).toHaveValue('deploying');
  });
});

describe('VillageForm names the roles behind each gated section', () => {
  it('labels the reviewer sections and the admin-only platform section', () => {
    renderForm(village());

    const labels = screen.getAllByTestId('section-access');
    expect(labels).toHaveLength(3);
    // Manager card and fit check: team, admins and ambassadors.
    expect(labels[0]).toHaveTextContent(/admin/i);
    expect(labels[0]).toHaveTextContent(/ambassador/i);
    expect(labels[1]).toHaveTextContent(/ambassador/i);
    // Platform settings: admins alone.
    expect(labels[2]).toHaveTextContent(/admin/i);
    expect(labels[2]).not.toHaveTextContent(/ambassador/i);
  });

  it('shows nothing on the public sections', () => {
    renderWithNextIntl(
      <VillageForm
        initial={village()}
        submitLabel="Save village"
        onSubmit={() => Promise.resolve()}
      />,
    );

    expect(screen.queryByTestId('section-access')).not.toBeInTheDocument();
  });
});
