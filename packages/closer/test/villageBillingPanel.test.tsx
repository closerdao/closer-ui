import React from 'react';

import VillageBillingPanel from '../components/VillageBillingPanel';
import VillageForm from '../components/VillageForm';

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Village } from '../types/village';
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

const api = jest.requireMock('../utils/api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
};

const SECRET = 'a'.repeat(64);

const summary = (overrides: Record<string, unknown> = {}) => ({
  villageId: 'v1',
  hubUrl: 'https://api.closer.earth',
  status: 'none',
  issuedAt: null,
  rotatedAt: null,
  hasSecret: false,
  ...overrides,
});

const active = () =>
  summary({
    status: 'active',
    issuedAt: '2026-02-01T10:00:00.000Z',
    rotatedAt: '2026-03-04T09:30:00.000Z',
    hasSecret: true,
  });

const httpError = (status: number, error: string) =>
  Object.assign(new Error(error), { response: { status, data: { error } } });

const renderPanel = async () => {
  renderWithNextIntl(
    <VillageBillingPanel
      villageId="v1"
      villageName="Riverbank"
      villageSlug="riverbank"
    />,
  );
  await waitFor(() =>
    expect(screen.getByTestId('village-billing-panel')).toBeInTheDocument(),
  );
};

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  api.patch.mockReset();
});

describe('VillageBillingPanel load states', () => {
  it('offers only the first issue while the village has no credentials', async () => {
    api.get.mockResolvedValue({ data: { results: summary() } });

    await renderPanel();

    expect(api.get).toHaveBeenCalledWith('/village/v1/billing');
    expect(screen.getByTestId('billing-status-pill')).toHaveTextContent(
      /not set up/i,
    );
    expect(
      screen.getByRole('button', { name: 'Issue credentials' }),
    ).toBeInTheDocument();
    // Suspend/reactivate 409 before a secret exists, so they are not offered.
    expect(screen.queryByRole('button', { name: 'Suspend' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reactivate' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Revoke' })).toBeNull();
  });

  it('shows the summary fields once credentials exist', async () => {
    api.get.mockResolvedValue({ data: { results: active() } });

    await renderPanel();

    expect(screen.getByTestId('billing-status-pill')).toHaveTextContent(
      /active/i,
    );
    expect(screen.getByText('https://api.closer.earth')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Rotate credentials' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Suspend' })).toBeInTheDocument();
  });

  it('renders a 403 inline instead of taking the page down', async () => {
    api.get.mockRejectedValue(httpError(403, 'Forbidden'));

    renderWithNextIntl(<VillageBillingPanel villageId="v1" />);

    await waitFor(() =>
      expect(screen.getByTestId('billing-load-error')).toHaveTextContent(
        /admin-only/i,
      ),
    );
  });
});

describe('VillageBillingPanel one-time secret', () => {
  const rotate = async () => {
    api.get.mockResolvedValue({ data: { results: summary() } });
    api.post.mockResolvedValue({
      data: {
        results: {
          villageId: 'v1',
          hubUrl: 'https://api.closer.earth',
          secret: SECRET,
        },
      },
    });

    await renderPanel();
    await userEvent.click(
      screen.getByRole('button', { name: 'Issue credentials' }),
    );
    return screen.findByRole('dialog');
  };

  it('shows the whole env triple and copies the secret', async () => {
    const dialog = await rotate();

    expect(api.post).toHaveBeenCalledWith('/village/v1/billing/rotate', {});
    expect(within(dialog).getByText(SECRET)).toBeInTheDocument();
    expect(within(dialog).getByText('BILLING_SECRET')).toBeInTheDocument();
    expect(within(dialog).getByText('BILLING_HUB_URL')).toBeInTheDocument();
    expect(within(dialog).getByText('BILLING_VILLAGE_ID')).toBeInTheDocument();

    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await userEvent.click(
      within(dialog).getAllByRole('button', { name: 'Copy' })[0],
    );
    expect(writeText).toHaveBeenCalledWith(SECRET);
  });

  it('will not close until the admin says they copied it', async () => {
    const dialog = await rotate();

    const done = within(dialog).getByRole('button', { name: 'Done' });
    expect(done).toBeDisabled();

    await userEvent.click(done);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('refetches the summary on dismissal and drops the secret from the DOM', async () => {
    const dialog = await rotate();

    // The rotate response carries no dates, so the panel takes the fresh
    // summary from the API rather than patching what it already had.
    api.get.mockResolvedValue({ data: { results: active() } });

    await userEvent.click(within(dialog).getByRole('checkbox'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));

    await waitFor(() =>
      expect(screen.getByTestId('billing-status-pill')).toHaveTextContent(
        /active/i,
      ),
    );
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText(SECRET)).toBeNull();
    expect(document.body.innerHTML).not.toContain(SECRET);
  });
});

describe('VillageBillingPanel status changes', () => {
  it('suspends from the response, without a refetch', async () => {
    api.get.mockResolvedValue({ data: { results: active() } });
    api.post.mockResolvedValue({
      data: { results: { ...active(), status: 'suspended' } },
    });

    await renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Suspend' }));

    await waitFor(() =>
      expect(screen.getByTestId('billing-status-pill')).toHaveTextContent(
        /suspended/i,
      ),
    );
    expect(api.post).toHaveBeenCalledWith('/village/v1/billing/status', {
      status: 'suspended',
    });
    expect(
      screen.getByRole('button', { name: 'Reactivate' }),
    ).toBeInTheDocument();
  });

  it('reactivates a suspended village', async () => {
    api.get.mockResolvedValue({
      data: { results: { ...active(), status: 'suspended' } },
    });
    api.post.mockResolvedValue({ data: { results: active() } });

    await renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Reactivate' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/village/v1/billing/status', {
        status: 'active',
      }),
    );
    expect(screen.getByTestId('billing-status-pill')).toHaveTextContent(
      /active/i,
    );
  });

  it('holds a revoke until the slug is typed back', async () => {
    api.get.mockResolvedValue({ data: { results: active() } });
    api.post.mockResolvedValue({
      data: { results: { ...active(), status: 'revoked' } },
    });

    await renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));

    const confirm = screen.getByTestId('billing-revoke-confirm');
    expect(confirm).toHaveTextContent(/Riverbank/);
    const cta = within(confirm).getByRole('button', { name: 'Revoke billing' });
    expect(cta).toBeDisabled();

    await userEvent.type(
      confirm.querySelector('input') as HTMLInputElement,
      'riverbank',
    );
    expect(cta).toBeEnabled();

    await userEvent.click(cta);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/village/v1/billing/status', {
        status: 'revoked',
      }),
    );
    expect(screen.getByTestId('billing-status-pill')).toHaveTextContent(
      /revoked/i,
    );
  });

  it("surfaces the API's own refusal text", async () => {
    api.get.mockResolvedValue({ data: { results: active() } });
    api.post.mockRejectedValue(
      httpError(409, 'No credentials yet — rotate to issue them'),
    );

    await renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Suspend' }));

    expect(
      await screen.findByText(/rotate to issue them/i),
    ).toBeInTheDocument();
  });
});

describe('the billing tab is admin-only', () => {
  const village = (): Partial<Village> => ({
    _id: 'v1',
    slug: 'riverbank',
    name: 'Riverbank',
    description: 'A regenerative village on the Douro.',
    country: 'Portugal',
    coords: [-8.61, 41.15],
    status: 'planning',
    tags: [],
    onboardingStatus: 'subscribed',
  });

  it('never renders the panel — or issues its request — for a reviewer', async () => {
    api.get.mockResolvedValue({ data: { results: summary() } });

    renderWithNextIntl(
      <VillageForm
        initial={village()}
        submitLabel="Save village"
        onSubmit={() => Promise.resolve()}
        isReviewer
      />,
    );

    expect(screen.queryByRole('tab', { name: 'Billing' })).toBeNull();
    expect(screen.queryByTestId('village-billing-panel')).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('mounts the panel when an admin opens the tab', async () => {
    api.get.mockResolvedValue({ data: { results: active() } });

    renderWithNextIntl(
      <VillageForm
        initial={village()}
        submitLabel="Save village"
        onSubmit={() => Promise.resolve()}
        isAdmin
        isReviewer
      />,
    );

    await userEvent.click(screen.getByRole('tab', { name: 'Billing' }));

    expect(
      await screen.findByTestId('village-billing-panel'),
    ).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/village/v1/billing');
  });
});
