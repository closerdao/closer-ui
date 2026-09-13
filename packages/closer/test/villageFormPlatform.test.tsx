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

const openTab = async (name: string) =>
  userEvent.click(screen.getByRole('tab', { name }));

/**
 * The platform fields live behind their own tab now, so every test that touches
 * them opens it first — the form keeps one submit for all tabs either way.
 */
const renderForm = async (initial: Partial<Village>) => {
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
  await openTab('Platform');
  return onSubmit;
};

const submit = async () =>
  userEvent.click(screen.getByRole('button', { name: 'Save village' }));

describe('VillageForm slug freezing follows the pending status', () => {
  it.each(['failed', 'live', 'suspended'])(
    'freezes the slug the moment an admin picks %s',
    async (status) => {
      const onSubmit = await renderForm(village());

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
    const onSubmit = await renderForm(village());

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

  it('offers the deploy outcomes on an unmanaged village', async () => {
    await renderForm(village());

    expect(optionValues()).toEqual(
      expect.arrayContaining(['failed', 'live', 'suspended']),
    );
    expect(statusSelect()).toBeEnabled();
  });

  it('withholds the deploy outcomes on a managed village', async () => {
    await renderForm(village({ managed: true }));

    expect(optionValues()).not.toEqual(
      expect.arrayContaining(['failed', 'live', 'suspended']),
    );
    expect(optionValues()).toEqual(
      expect.arrayContaining(['map_only', 'subscribed']),
    );
  });

  it('never offers the in-flight stages, managed or not', async () => {
    await renderForm(village());

    expect(optionValues()).not.toEqual(
      expect.arrayContaining(['deploy_requested']),
    );
    expect(optionValues()).not.toEqual(expect.arrayContaining(['deploying']));
  });

  it('locks the stage a managed village is already at when procurement owns it', async () => {
    await renderForm(village({ managed: true, onboardingStatus: 'live' }));

    expect(statusSelect()).toBeDisabled();
    expect(statusSelect()).toHaveValue('live');
    expect(
      within(
        screen.getByText('Onboarding stage').closest('label') as HTMLElement,
      ).getByText(/owned by procurement/i),
    ).toBeInTheDocument();
  });

  it('locks the stage while a deploy is in flight', async () => {
    await renderForm(village({ onboardingStatus: 'deploying' }));

    expect(statusSelect()).toBeDisabled();
    expect(statusSelect()).toHaveValue('deploying');
  });
});

describe('VillageForm names the roles behind each gated tab', () => {
  it('labels the reviewer tab and the admin-only ones', async () => {
    // Already on Platform: admins alone.
    await renderForm(village());
    expect(screen.getByTestId('section-access')).toHaveTextContent(/admin/i);
    expect(screen.getByTestId('section-access')).not.toHaveTextContent(
      /ambassador/i,
    );

    // Assessment — the manager card and the fit check: team, admins and
    // ambassadors.
    await openTab('Assessment');
    expect(screen.getByTestId('section-access')).toHaveTextContent(/admin/i);
    expect(screen.getByTestId('section-access')).toHaveTextContent(
      /ambassador/i,
    );

    await openTab('Billing');
    expect(screen.getByTestId('section-access')).toHaveTextContent(/admin/i);
    expect(screen.getByTestId('section-access')).not.toHaveTextContent(
      /ambassador/i,
    );
  });

  it('shows nothing on the public tabs', async () => {
    await renderForm(village());

    await openTab('Profile');
    expect(screen.queryByTestId('section-access')).not.toBeInTheDocument();

    await openTab('Contact');
    expect(screen.queryByTestId('section-access')).not.toBeInTheDocument();
  });

  it('offers no gated tab at all to an editor with neither role', () => {
    renderWithNextIntl(
      <VillageForm
        initial={village()}
        submitLabel="Save village"
        onSubmit={() => Promise.resolve()}
      />,
    );

    expect(screen.queryByTestId('section-access')).not.toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Profile',
      'Contact',
    ]);
  });
});

describe('VillageForm billing tab', () => {
  it('is offered only once the village has an id to hang credentials off', () => {
    renderWithNextIntl(
      <VillageForm
        submitLabel="Create village"
        onSubmit={() => Promise.resolve()}
        isAdmin
        isReviewer
      />,
    );

    expect(screen.queryByRole('tab', { name: 'Billing' })).toBeNull();
  });
});
