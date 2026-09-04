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

  it('names why the viewer sees the card, and stays quiet for a public visitor', () => {
    const { unmount } = renderWithNextIntl(
      <DeployCTA village={village()} accessReason="creator" />,
    );

    expect(screen.getByTestId('village-access-reason')).toHaveTextContent(
      /village creator/i,
    );
    unmount();

    renderWithNextIntl(<DeployCTA village={village()} />);
    expect(
      screen.queryByTestId('village-access-reason'),
    ).not.toBeInTheDocument();
  });

  // A missing slug no longer sends anyone to the edit page: the card offers
  // the address field itself, prefilled from the village name.
  it('offers the address field when the slug is missing', () => {
    renderWithNextIntl(<DeployCTA village={village({ slug: '' })} canDeploy />);

    expect(card()).toHaveAttribute('data-deploy-state', 'not_ready');
    expect(screen.getByLabelText(/your address/i)).toHaveValue('riverbank');
    expect(
      screen.getByRole('button', { name: /deploy village/i }),
    ).toBeEnabled();
  });

  it('still blocks a missing slug for a viewer who cannot set one here', () => {
    renderWithNextIntl(<DeployCTA village={village({ slug: '' })} />);

    expect(card()).toHaveAttribute('data-deploy-state', 'not_ready');
    expect(screen.getByText(/no slug/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
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

  // Admins keep a pressable button in every state — live and suspended
  // included — so they can always re-run procurement.
  it('offers an admin a redeploy button on a live village', async () => {
    const deploy = jest
      .fn()
      .mockResolvedValue({ village: village({ onboardingStatus: 'live' }) });
    renderWithNextIntl(
      <DeployCTA
        village={village({
          onboardingStatus: 'live',
          managed: true,
          appUrl: 'https://riverbank.closer.earth',
        })}
        canDeploy
        isAdmin
        deploy={deploy}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /redeploy/i }));
    await waitFor(() => expect(deploy).toHaveBeenCalledWith('v1'));
  });

  it('offers an admin a redeploy button on a suspended village', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'suspended' })}
        canDeploy
        isAdmin
      />,
    );

    expect(screen.getByRole('button', { name: /redeploy/i })).toBeEnabled();
  });

  it('keeps live and suspended read-only for non-admins', () => {
    renderWithNextIntl(
      <DeployCTA village={village({ onboardingStatus: 'live' })} canDeploy />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('DeployCTA review form', () => {
  const deployed = () => village({ onboardingStatus: 'deploy_requested' });

  it('deploys without a PATCH when nothing was edited', async () => {
    const deploy = jest.fn().mockResolvedValue({ village: deployed() });
    const save = jest.fn();

    renderWithNextIntl(
      <DeployCTA village={village()} canDeploy deploy={deploy} save={save} />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    await waitFor(() => expect(deploy).toHaveBeenCalledWith('v1'));
    expect(save).not.toHaveBeenCalled();
  });

  it('saves an edited address before deploying', async () => {
    const deploy = jest.fn().mockResolvedValue({ village: deployed() });
    const save = jest.fn().mockResolvedValue(village({ slug: 'river-bend' }));
    const isSubdomainTaken = jest.fn().mockResolvedValue(false);

    renderWithNextIntl(
      <DeployCTA
        village={village()}
        canDeploy
        deploy={deploy}
        save={save}
        isSubdomainTaken={isSubdomainTaken}
      />,
    );
    const address = screen.getByLabelText(/your address/i);
    await userEvent.clear(address);
    await userEvent.type(address, 'River Bend!');
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('v1', { slug: 'river-bend' }),
    );
    expect(isSubdomainTaken).toHaveBeenCalledWith('river-bend', 'v1');
    expect(deploy).toHaveBeenCalledWith('v1');
  });

  it('refuses a taken address without deploying', async () => {
    const deploy = jest.fn();
    const save = jest.fn();

    renderWithNextIntl(
      <DeployCTA
        village={village()}
        canDeploy
        deploy={deploy}
        save={save}
        isSubdomainTaken={jest.fn().mockResolvedValue(true)}
      />,
    );
    const address = screen.getByLabelText(/your address/i);
    await userEvent.clear(address);
    await userEvent.type(address, 'taken-name');
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /already taken/i,
    );
    expect(save).not.toHaveBeenCalled();
    expect(deploy).not.toHaveBeenCalled();
  });

  // No projectManager on the village, so the contact is the field the route
  // resolves — the edit lands there.
  it('saves an edited owner email to the contact before deploying', async () => {
    const deploy = jest.fn().mockResolvedValue({ village: deployed() });
    const save = jest.fn().mockResolvedValue(village());

    renderWithNextIntl(
      <DeployCTA village={village()} canDeploy deploy={deploy} save={save} />,
    );
    const email = screen.getByLabelText(/owner email/i);
    await userEvent.clear(email);
    await userEvent.type(email, 'founder@riverbank.pt');
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('v1', {
        contact: { email: 'founder@riverbank.pt' },
      }),
    );
    expect(deploy).toHaveBeenCalledWith('v1');
  });

  // The route reads projectManager.email before contact.email, so when the
  // village has one, the edit must land there for the review to win.
  it('writes the email to the project manager when that field is set', async () => {
    const deploy = jest.fn().mockResolvedValue({ village: deployed() });
    const save = jest.fn().mockResolvedValue(village());

    renderWithNextIntl(
      <DeployCTA
        village={village({
          projectManager: { name: 'Ana', email: 'ana@riverbank.pt' },
        })}
        canDeploy
        deploy={deploy}
        save={save}
      />,
    );
    const email = screen.getByLabelText(/owner email/i);
    expect(email).toHaveValue('ana@riverbank.pt');
    await userEvent.clear(email);
    await userEvent.type(email, 'founder@riverbank.pt');
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('v1', {
        projectManager: { name: 'Ana', email: 'founder@riverbank.pt' },
      }),
    );
  });

  it('rejects a malformed email without touching the API', async () => {
    const deploy = jest.fn();
    const save = jest.fn();

    renderWithNextIntl(
      <DeployCTA village={village()} canDeploy deploy={deploy} save={save} />,
    );
    const email = screen.getByLabelText(/owner email/i);
    await userEvent.clear(email);
    await userEvent.type(email, 'not-an-email');
    await userEvent.click(
      screen.getByRole('button', { name: /deploy village/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /look like an email/i,
    );
    expect(save).not.toHaveBeenCalled();
    expect(deploy).not.toHaveBeenCalled();
  });

  it('keeps the address read-only on a retry — the slug is frozen', () => {
    renderWithNextIntl(
      <DeployCTA village={village({ onboardingStatus: 'failed' })} canDeploy />,
    );

    expect(screen.queryByLabelText(/your address/i)).not.toBeInTheDocument();
    expect(screen.getByText(/will deploy as riverbank/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/owner email/i)).toHaveValue(
      'hello@riverbank.pt',
    );
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

describe('DeployCTA retired state', () => {
  it('explains retention and offers an admin Redeploy', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'retired', managed: true })}
        isAdmin
      />,
    );

    expect(card()).toHaveAttribute('data-deploy-state', 'retired');
    expect(screen.getByText(/kept for 90 days/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /redeploy/i }),
    ).toBeEnabled();
  });

  it('is read-only for a non-admin', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'retired', managed: true })}
        canDeploy
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('DeployCTA lifecycle controls — visibility', () => {
  it('offers Suspend and Retire on a managed live village to admin/team', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'live', managed: true })}
        canManageLifecycle
      />,
    );

    expect(
      screen.getByRole('button', { name: /^suspend$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^retire$/i }),
    ).toBeInTheDocument();
  });

  it('offers Reactivate and Retire on a suspended village to admin/team', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'suspended' })}
        canManageLifecycle
      />,
    );

    expect(
      screen.getByRole('button', { name: /^reactivate$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^retire$/i }),
    ).toBeInTheDocument();
  });

  it('hides lifecycle controls from a founder/ambassador who may only deploy', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'live', managed: true })}
        canDeploy
      />,
    );

    expect(
      screen.queryByRole('button', { name: /^suspend$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^retire$/i }),
    ).not.toBeInTheDocument();
  });

  // The API 409s an unmanaged village (`not_procurement_managed`) — the card
  // hides the controls rather than offering a button that always fails.
  it('gives an unmanaged live village none of the three, even for admin/team', () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'live' })}
        canManageLifecycle
        isAdmin
      />,
    );

    expect(card()).toHaveAttribute('data-deploy-state', 'unmanaged_live');
    expect(
      screen.queryByRole('button', { name: /^suspend$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^retire$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^reactivate$/i }),
    ).not.toBeInTheDocument();
  });
});

describe('DeployCTA suspend / reactivate', () => {
  it('suspends after an inline confirm and shows the waiting note', async () => {
    const suspend = jest.fn().mockResolvedValue({ village: undefined });
    const onDeployed = jest.fn();
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'live', managed: true })}
        canManageLifecycle
        suspend={suspend}
        onDeployed={onDeployed}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^suspend$/i }));
    expect(
      screen.getByRole('button', { name: /yes, suspend/i }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /yes, suspend/i }),
    );

    await waitFor(() => expect(suspend).toHaveBeenCalledWith('v1'));
    expect(
      await screen.findByText(/suspend requested.*waiting for procurement/i),
    ).toBeInTheDocument();
    expect(onDeployed).toHaveBeenCalledWith(undefined);
  });

  it('cancels the inline confirm without calling the route', async () => {
    const suspend = jest.fn();
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'live', managed: true })}
        canManageLifecycle
        suspend={suspend}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^suspend$/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(
      screen.queryByRole('button', { name: /yes, suspend/i }),
    ).not.toBeInTheDocument();
    expect(suspend).not.toHaveBeenCalled();
  });

  it('reactivates after an inline confirm', async () => {
    const reactivate = jest
      .fn()
      .mockResolvedValue({ village: village({ onboardingStatus: 'suspended' }) });
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'suspended' })}
        canManageLifecycle
        reactivate={reactivate}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /^reactivate$/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /yes, reactivate/i }),
    );

    await waitFor(() => expect(reactivate).toHaveBeenCalledWith('v1'));
    expect(
      await screen.findByText(
        /reactivate requested.*waiting for procurement/i,
      ),
    ).toBeInTheDocument();
  });

  // A 202-with-warning is still a recorded request — handled like the deploy
  // path's own warning, not as an error.
  it('shows the network warning alongside the waiting note on a 202', async () => {
    const suspend = jest.fn().mockResolvedValue({
      village: undefined,
      warning: 'Procurement could not be reached. It will need to be confirmed manually.',
    });
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'live', managed: true })}
        canManageLifecycle
        suspend={suspend}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^suspend$/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /yes, suspend/i }),
    );

    expect(
      await screen.findByText(/could not be reached/i),
    ).toBeInTheDocument();
  });

  it('shows a 4xx error verbatim', async () => {
    const suspend = jest
      .fn()
      .mockRejectedValue(
        new DeployVillageError(
          'Village must be live to suspend (status: suspended).',
          400,
          'suspend_precondition_failed',
        ),
      );
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'live', managed: true })}
        canManageLifecycle
        suspend={suspend}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^suspend$/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /yes, suspend/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Village must be live to suspend (status: suspended).',
    );
  });
});

describe('DeployCTA retire', () => {
  it('opens a modal requiring the slug and rejects a mismatch', async () => {
    const retire = jest.fn();
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'live', managed: true })}
        canManageLifecycle
        retire={retire}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^retire$/i }));
    expect(
      screen.getByRole('heading', { name: /retire this village/i }),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText(/type the slug to confirm/i),
      'not-the-slug',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /yes, retire this village/i }),
    );

    expect(screen.getByText(/doesn't match/i)).toBeInTheDocument();
    expect(retire).not.toHaveBeenCalled();
  });

  it('retires once the typed slug matches', async () => {
    const retire = jest
      .fn()
      .mockResolvedValue({ village: village({ onboardingStatus: 'live' }) });
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'live', managed: true })}
        canManageLifecycle
        retire={retire}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /^retire$/i }));
    await userEvent.type(
      screen.getByLabelText(/type the slug to confirm/i),
      'riverbank',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /yes, retire this village/i }),
    );

    await waitFor(() =>
      expect(retire).toHaveBeenCalledWith('v1', 'riverbank'),
    );
    expect(
      await screen.findByText(/retire requested.*waiting for procurement/i),
    ).toBeInTheDocument();
  });

  it('offers Retire from the suspended state too', async () => {
    renderWithNextIntl(
      <DeployCTA
        village={village({ onboardingStatus: 'suspended' })}
        canManageLifecycle
      />,
    );

    expect(
      screen.getByRole('button', { name: /^retire$/i }),
    ).toBeInTheDocument();
  });
});
