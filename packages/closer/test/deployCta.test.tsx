import React from 'react';

import DeployCTA from '../components/VillageUI/DeployCTA';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Village } from '../types/village';
import { DeployVillageError } from '../utils/village.utils';
import { renderWithNextIntl } from './utils';

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "./api" the utils import.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
}));

const village = (overrides: Partial<Village> = {}): Village =>
  ({
    _id: 'v1',
    slug: 'riverbank',
    name: 'Riverbank',
    closer: false,
    description: '',
    tags: [],
    country: 'Portugal',
    coords: [-8.6, 41.1],
    status: 'planning',
    contact: { email: 'hello@riverbank.pt' },
    onboardingStatus: 'subscribed',
    ...overrides,
  } as Village);

const card = () => screen.getByTestId('deploy-cta');

describe('DeployCTA states', () => {
  it('offers the button when the village is ready and the viewer may press it', () => {
    renderWithNextIntl(<DeployCTA village={village()} canDeploy />);

    expect(card()).toHaveAttribute('data-deploy-state', 'ready');
    expect(
      screen.getByRole('button', { name: /deploy village/i }),
    ).toBeEnabled();
  });

  it('is read-only for a viewer who may not deploy', () => {
    renderWithNextIntl(<DeployCTA village={village()} />);

    expect(card()).toHaveAttribute('data-deploy-state', 'ready');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('blocks on a missing slug', () => {
    renderWithNextIntl(<DeployCTA village={village({ slug: '' })} canDeploy />);

    expect(card()).toHaveAttribute('data-deploy-state', 'not_ready');
    expect(
      screen.getByRole('button', { name: /deploy village/i }),
    ).toBeDisabled();
  });

  // The route falls back to the creator's account email, which this page
  // cannot see — so a missing address must not disable the button.
  it('warns about a missing founder email without blocking', () => {
    renderWithNextIntl(
      <DeployCTA village={village({ contact: undefined })} canDeploy />,
    );

    expect(card()).toHaveAttribute('data-deploy-state', 'ready');
    expect(screen.getByText(/no founder email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /deploy village/i }),
    ).toBeEnabled();
  });

  it.each(['deploy_requested', 'deploying'])(
    'disables the button while %s',
    (onboardingStatus) => {
      renderWithNextIntl(
        <DeployCTA
          village={village({ onboardingStatus } as Partial<Village>)}
          canDeploy
        />,
      );

      expect(card()).toHaveAttribute('data-deploy-state', 'in_progress');
      expect(screen.getByRole('button')).toBeDisabled();
    },
  );

  it('shows the deploy error and a retry after a failure', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({
          onboardingStatus: 'failed',
          deployError: 'DNS record already exists',
        })}
        canDeploy
      />,
    );

    expect(card()).toHaveAttribute('data-deploy-state', 'failed');
    expect(screen.getByText('DNS record already exists')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry deploy/i })).toBeEnabled();
  });

  it('offers no retry to a viewer who may not deploy', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({
          onboardingStatus: 'failed',
          deployError: 'DNS record already exists',
        })}
      />,
    );

    expect(screen.getByText('DNS record already exists')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('links the app and API once live', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({
          onboardingStatus: 'live',
          managed: true,
          appUrl: 'https://riverbank.closer.earth',
          apiUrl: 'https://api.riverbank.closer.earth',
        })}
        canDeploy
      />,
    );

    expect(card()).toHaveAttribute('data-deploy-state', 'live');
    expect(screen.getByRole('link', { name: /open app/i })).toHaveAttribute(
      'href',
      'https://riverbank.closer.earth',
    );
    expect(screen.getByRole('link', { name: /open api/i })).toHaveAttribute(
      'href',
      'https://api.riverbank.closer.earth',
    );
  });

  // A hand-marked live village (TDF-style) predates procurement.
  it('marks an unmanaged live village as such', () => {
    renderWithNextIntl(
      <DeployCTA village={village({ onboardingStatus: 'live' })} canDeploy />,
    );

    expect(card()).toHaveAttribute('data-deploy-state', 'unmanaged_live');
    expect(screen.getByText(/marked live by hand/i)).toBeInTheDocument();
  });

  it('renders suspended without any action', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'suspended' })}
        canDeploy
      />,
    );

    expect(card()).toHaveAttribute('data-deploy-state', 'suspended');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('DeployCTA deploy call', () => {
  it('hands the returned village back on a clean 202', async () => {
    const deployed = village({ onboardingStatus: 'deploy_requested' });
    const deploy = jest.fn().mockResolvedValue({ village: deployed });
    const onDeployed = jest.fn();

    renderWithNextIntl(
      <DeployCTA
        village={village()}
        canDeploy
        deploy={deploy}
        onDeployed={onDeployed}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    await waitFor(() => expect(onDeployed).toHaveBeenCalledWith(deployed));
    expect(deploy).toHaveBeenCalledWith('v1');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  // 202 + warning: recorded, but procurement never answered. Not a failure,
  // and not a clean hand-off either.
  it('says so when the request was recorded but procurement was unreachable', async () => {
    const deploy = jest.fn().mockResolvedValue({
      village: village({ onboardingStatus: 'deploy_requested' }),
      warning: 'procurement_unreachable',
    });

    renderWithNextIntl(
      <DeployCTA village={village()} canDeploy deploy={deploy} />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/did not answer/i);
    expect(status).toHaveTextContent('procurement_unreachable');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('surfaces the error text procurement sent on a 4xx', async () => {
    const deploy = jest
      .fn()
      .mockRejectedValue(
        new DeployVillageError(
          'Subdomain riverbank is taken',
          409,
          'slug_taken',
        ),
      );

    renderWithNextIntl(
      <DeployCTA village={village()} canDeploy deploy={deploy} />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Subdomain riverbank is taken');
    expect(alert).toHaveTextContent('slug_taken');
  });

  // A bare 409 is the route's own double-press guard, not procurement's.
  it('explains a bare 409 in its own words', async () => {
    const deploy = jest
      .fn()
      .mockRejectedValue(new DeployVillageError('Conflict', 409));

    renderWithNextIntl(
      <DeployCTA village={village()} canDeploy deploy={deploy} />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /already in progress/i,
    );
  });

  it('surfaces a 403 for a viewer the API refuses', async () => {
    const deploy = jest
      .fn()
      .mockRejectedValue(
        new DeployVillageError('You may not deploy this village', 403),
      );

    renderWithNextIntl(
      <DeployCTA village={village()} canDeploy deploy={deploy} />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You may not deploy this village',
    );
  });
});
