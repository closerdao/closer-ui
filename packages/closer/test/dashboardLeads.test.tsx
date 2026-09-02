import { useRouter } from 'next/router';

import React from 'react';

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import useRBAC from '../hooks/useRBAC';
import LeadsDashboardIndexPage from '../pages/dashboard/leads';
import LeadsDashboardPage from '../pages/dashboard/leads/[tab]';
import type { Lead } from '../types/lead';
import {
  enrichLead,
  fetchLeadActions,
  fetchLeadOwnerCandidates,
  fetchLeadOwners,
  fetchLeadsBoard,
  fetchVillageFit,
  patchLead,
  previewLeadEmail,
  sendLeadEmail,
} from '../utils/leads.utils';
import { renderWithNextIntl } from './utils';

jest.mock('../components/Dashboard/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../hooks/useRBAC', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../utils/leads.utils', () => ({
  __esModule: true,
  fetchLeadsBoard: jest.fn(),
  patchLead: jest.fn(),
  enrichLead: jest.fn(),
  syncLeads: jest.fn(),
  fetchLeadOwnerCandidates: jest.fn(),
  fetchLeadOwners: jest.fn(),
  fetchVillageFit: jest.fn(),
  fetchLeadActions: jest.fn(),
  previewLeadEmail: jest.fn(),
  sendLeadEmail: jest.fn(),
}));

const villageLead: Lead = {
  _id: 'lead-1',
  type: 'village',
  email: 'hello@riverbank.pt',
  stage: 'village_pre_assessed',
  aiContext: 'Riverbank has 40 residents and is looking for a booking system.',
  fit: { verdict: 'fund_eligible' },
  aiMeta: { provider: 'anthropic' },
  managedBy: ['amb-1'],
  lastContactedAt: '2026-08-20T10:00:00.000Z',
  nextActionAt: '2026-08-25T10:00:00.000Z',
  notes: 'called once',
  tags: ['warm'],
  villages: [{ _id: 'v-1', name: 'Riverbank', slug: 'riverbank' }],
  applications: [{ _id: 'app-1', name: 'Riverbank Collective' }],
  enrichment: {
    facts: [{ text: 'Runs 12 rooms', sourceUrl: 'https://riverbank.pt' }],
    openQuestions: ['Who owns the land?'],
    suggestedCriteria: {
      hasLand: {
        value: true,
        confidence: 0.9,
        sourceUrl: 'https://riverbank.pt',
      },
    },
  },
};

const memberLead: Lead = {
  _id: 'lead-2',
  type: 'member',
  email: 'ada@example.com',
  stage: 'application_open',
  user: { _id: 'u-9', screenname: 'Ada Lovelace' },
  // The deterministic path ran instead of the model.
  aiMeta: { provider: 'fallback' },
  signals: { nightsStayed: 12, journeyHighlights: ['Stayed twice in 2025'] },
};

const routerReplace = jest.fn();

/** The tab is a route segment, so a test picks it the way a link would. */
const setTab = (tab: string) =>
  (useRouter as unknown as jest.Mock).mockReturnValue({
    query: { tab },
    pathname: '/dashboard/leads/[tab]',
    asPath: `/dashboard/leads/${tab}`,
    push: jest.fn(),
    replace: routerReplace,
    prefetch: jest.fn(),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  });

const setUser = (roles: string[]) =>
  (useAuth as jest.Mock).mockReturnValue({
    user: { _id: 'me', roles, screenname: 'Me' },
  });

describe('LeadsDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRBAC as jest.Mock).mockReturnValue({ hasAccess: () => true });
    (fetchLeadsBoard as jest.Mock).mockResolvedValue({
      rows: [villageLead, memberLead],
      total: 2,
    });
    (fetchLeadOwnerCandidates as jest.Mock).mockResolvedValue([
      { _id: 'amb-1', screenname: 'Grace Hopper' },
      { _id: 'amb-2', screenname: 'Alan Turing' },
    ]);
    (fetchLeadOwners as jest.Mock).mockResolvedValue([
      { _id: 'amb-1', screenname: 'Grace Hopper' },
    ]);
    (patchLead as jest.Mock).mockResolvedValue(null);
    (enrichLead as jest.Mock).mockResolvedValue(undefined);
    (fetchVillageFit as jest.Mock).mockResolvedValue(null);
    (fetchLeadActions as jest.Mock).mockResolvedValue({
      emailTemplates: [
        {
          key: 'lead_intro',
          name: 'Intro',
          description: 'Quotes the application back.',
        },
        { key: 'lead_next_step', name: 'Next step' },
      ],
    });
    (previewLeadEmail as jest.Mock).mockResolvedValue({
      send: 'lead_intro',
      candidates: 2,
      recipients: [
        {
          leadId: 'lead-1',
          email: 'hello@riverbank.pt',
          status: 'would_send',
          projectName: 'Riverbank',
        },
        { leadId: 'lead-2', email: 'ada@example.com', status: 'would_send' },
      ],
      sample: {
        leadId: 'lead-1',
        email: 'hello@riverbank.pt',
        subject: 'Riverbank and Closer',
        body: '<p>Hello Riverbank</p>',
        emailEnabled: true,
      },
    });
    (sendLeadEmail as jest.Mock).mockResolvedValue({
      send: 'lead_intro',
      candidates: 2,
      sent: 2,
      skipped: 0,
      failed: 0,
      results: [
        { leadId: 'lead-1', email: 'hello@riverbank.pt', status: 'sent' },
        { leadId: 'lead-2', email: 'ada@example.com', status: 'sent' },
      ],
    });
    setUser(['admin']);
    setTab('all');
  });

  describe('send email', () => {
    const openModal = async () => {
      renderWithNextIntl(<LeadsDashboardPage />);
      await userEvent.click(
        await screen.findByRole('button', { name: 'Send email' }),
      );
      return screen.findByRole('heading', {
        name: 'Send an email to every lead',
      });
    };

    it('offers the templates the API lists and previews the first one', async () => {
      await openModal();

      const picker = await screen.findByLabelText('Template');
      expect(
        within(picker)
          .getAllByRole('option')
          .map((o) => o.textContent),
      ).toEqual(['Intro', 'Next step']);
      expect(screen.getByText('Quotes the application back.')).toBeVisible();

      await waitFor(() =>
        expect(previewLeadEmail).toHaveBeenCalledWith({
          send: 'lead_intro',
          type: undefined,
          subject: undefined,
          message: undefined,
        }),
      );
      expect(await screen.findByText('2 recipients')).toBeVisible();
      expect(screen.getByText('Riverbank and Closer')).toBeVisible();
      const srcdoc = screen.getByTitle('Preview').getAttribute('srcdoc') ?? '';
      expect(srcdoc).toContain('Hello Riverbank');
      // The body is wrapped in the page's font so it does not render in serif.
      expect(srcdoc).toMatch(/<style>body\{margin:0;/);
    });

    it('previews the email as whichever recipient is picked', async () => {
      await openModal();
      const field = await screen.findByRole('listbox', { name: 'To' });
      const chips = within(field).getAllByRole('option');
      expect(chips.map((chip) => chip.textContent)).toEqual([
        'All',
        'Riverbank',
        'ada@example.com',
      ]);
      // Everyone is selected until a person is picked.
      expect(chips[0]).toHaveAttribute('aria-selected', 'true');

      await userEvent.click(chips[2]);

      await waitFor(() =>
        expect(previewLeadEmail).toHaveBeenLastCalledWith(
          expect.objectContaining({ send: 'lead_intro', sampleId: 'lead-2' }),
        ),
      );
      expect(
        within(screen.getByRole('listbox', { name: 'To' })).getAllByRole(
          'option',
        )[2],
      ).toHaveAttribute('aria-selected', 'true');
    });

    it('sends to just the one person picked in the To field', async () => {
      await openModal();
      const field = await screen.findByRole('listbox', { name: 'To' });
      await userEvent.click(within(field).getAllByRole('option')[2]);
      await waitFor(() =>
        expect(previewLeadEmail).toHaveBeenLastCalledWith(
          expect.objectContaining({ sampleId: 'lead-2' }),
        ),
      );

      await userEvent.click(
        await screen.findByRole('button', { name: 'Send to 1 lead' }),
      );
      expect(
        screen.getByText('This emails 1 person and cannot be undone.'),
      ).toBeVisible();
      await userEvent.click(
        screen.getByRole('button', { name: 'Yes, send now' }),
      );

      await waitFor(() =>
        expect(sendLeadEmail).toHaveBeenCalledWith(
          expect.objectContaining({ send: 'lead_intro', leadIds: ['lead-2'] }),
        ),
      );
      expect((sendLeadEmail as jest.Mock).mock.calls[0][0]).not.toHaveProperty(
        'sampleId',
      );
    });

    it('greys out anyone the API reports it would not send to', async () => {
      (previewLeadEmail as jest.Mock).mockResolvedValue({
        send: 'lead_intro',
        candidates: 1,
        recipients: [
          {
            leadId: 'lead-1',
            email: 'hello@riverbank.pt',
            status: 'skipped',
            reason: 'already_sent',
            projectName: 'Riverbank',
          },
          { leadId: 'lead-2', email: 'ada@example.com', status: 'would_send' },
        ],
        sample: {
          leadId: 'lead-2',
          email: 'ada@example.com',
          subject: 'Closer',
          body: '<p>Hi Ada</p>',
          emailEnabled: true,
        },
      });
      await openModal();
      const field = await screen.findByRole('listbox', { name: 'To' });
      const done = within(field).getByRole('option', { name: 'Riverbank' });
      expect(done).toBeDisabled();
      expect(done).toHaveAttribute(
        'title',
        'hello@riverbank.pt · already_sent',
      );

      await userEvent.click(done);
      expect(
        within(field).getByRole('option', { name: 'All' }),
      ).toHaveAttribute('aria-selected', 'true');
      expect(
        await screen.findByRole('button', { name: 'Send to 1 lead' }),
      ).toBeVisible();
    });

    it('goes back to everyone when All is picked again', async () => {
      await openModal();
      const field = await screen.findByRole('listbox', { name: 'To' });
      await userEvent.click(within(field).getAllByRole('option')[2]);
      await screen.findByRole('button', { name: 'Send to 1 lead' });

      await userEvent.click(within(field).getAllByRole('option')[0]);

      expect(
        await screen.findByRole('button', { name: 'Send to 2 leads' }),
      ).toBeVisible();
      await waitFor(() =>
        expect(previewLeadEmail).toHaveBeenLastCalledWith(
          expect.objectContaining({ sampleId: undefined }),
        ),
      );
    });

    it('re-previews with the chosen template and the sender words', async () => {
      await openModal();
      await waitFor(() => expect(previewLeadEmail).toHaveBeenCalled());

      await userEvent.selectOptions(
        await screen.findByLabelText('Template'),
        'lead_next_step',
      );
      await userEvent.type(screen.getByLabelText('Subject'), 'Hello again');
      await userEvent.type(
        screen.getByLabelText('Your message'),
        'Lovely to meet you at the fair.',
      );

      await waitFor(() =>
        expect(previewLeadEmail).toHaveBeenLastCalledWith({
          send: 'lead_next_step',
          type: undefined,
          subject: 'Hello again',
          message: 'Lovely to meet you at the fair.',
        }),
      );
    });

    it('tells the template request apart from an instance with none', async () => {
      (fetchLeadActions as jest.Mock).mockRejectedValue({
        response: { data: { error: 'Not found' } },
      });
      await openModal();

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'The templates could not be loaded: Not found',
      );
      expect(
        screen.queryByText(
          'No email templates are available on this instance.',
        ),
      ).not.toBeInTheDocument();
    });

    it('starts on lead_intro even when the API lists it second', async () => {
      (fetchLeadActions as jest.Mock).mockResolvedValue({
        emailTemplates: [
          { key: 'lead_next_step', name: 'Next step' },
          { key: 'lead_intro', name: 'Intro' },
        ],
      });
      await openModal();

      expect(await screen.findByLabelText('Template')).toHaveValue(
        'lead_intro',
      );
      await waitFor(() =>
        expect(previewLeadEmail).toHaveBeenCalledWith(
          expect.objectContaining({ send: 'lead_intro' }),
        ),
      );
    });

    it('can restrict the batch to people who applied', async () => {
      await openModal();
      await waitFor(() => expect(previewLeadEmail).toHaveBeenCalled());
      expect(
        (previewLeadEmail as jest.Mock).mock.calls[0][0],
      ).not.toHaveProperty('applicantsOnly', true);

      await userEvent.click(
        screen.getByLabelText(/Only people who sent an application/),
      );

      await waitFor(() =>
        expect(previewLeadEmail).toHaveBeenLastCalledWith(
          expect.objectContaining({ send: 'lead_intro', applicantsOnly: true }),
        ),
      );
    });

    it('follows the tab: the villages tab only writes to villages', async () => {
      setTab('village');
      await openModal();

      await waitFor(() =>
        expect(previewLeadEmail).toHaveBeenCalledWith(
          expect.objectContaining({ send: 'lead_intro', type: 'village' }),
        ),
      );
    });

    it('sends exactly what was previewed, after a confirmation', async () => {
      await openModal();
      await userEvent.type(
        await screen.findByLabelText('Your message'),
        'See you soon.',
      );
      await waitFor(() =>
        expect(previewLeadEmail).toHaveBeenLastCalledWith(
          expect.objectContaining({ message: 'See you soon.' }),
        ),
      );

      await userEvent.click(
        await screen.findByRole('button', { name: 'Send to 2 leads' }),
      );
      expect(sendLeadEmail).not.toHaveBeenCalled();
      expect(
        screen.getByText('This emails 2 people and cannot be undone.'),
      ).toBeVisible();

      const boardLoads = (fetchLeadsBoard as jest.Mock).mock.calls.length;
      await userEvent.click(
        screen.getByRole('button', { name: 'Yes, send now' }),
      );

      await waitFor(() =>
        expect(sendLeadEmail).toHaveBeenCalledWith({
          send: 'lead_intro',
          type: undefined,
          subject: undefined,
          message: 'See you soon.',
        }),
      );
      expect(
        await screen.findByText('Sent 2, skipped 0, failed 0.'),
      ).toBeVisible();
      // The timeline changed for everyone written to, so the board reloads.
      await waitFor(() =>
        expect(
          (fetchLeadsBoard as jest.Mock).mock.calls.length,
        ).toBeGreaterThan(boardLoads),
      );
    });

    it('cannot send when nobody is left to send to', async () => {
      (previewLeadEmail as jest.Mock).mockResolvedValue({
        send: 'lead_intro',
        candidates: 0,
        recipients: [],
        sample: null,
      });
      await openModal();

      expect(
        await screen.findByText(
          'Everyone in this view already had this template.',
        ),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    });

    it('surfaces a preview failure instead of a blank panel', async () => {
      (previewLeadEmail as jest.Mock).mockRejectedValue({
        response: { data: { error: 'Unknown template' } },
      });
      await openModal();

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Unknown template',
      );
    });

    it('lets an ambassador send to their own leads', async () => {
      setUser(['ambassador']);
      await openModal();
      await waitFor(() => expect(previewLeadEmail).toHaveBeenCalled());
    });
  });

  it('opens the lead an application card linked to', async () => {
    (useRouter as unknown as jest.Mock).mockReturnValue({
      query: { tab: 'all', lead: 'lead-1' },
      pathname: '/dashboard/leads/[tab]',
      asPath: '/dashboard/leads/all?lead=lead-1',
      push: jest.fn(),
      replace: routerReplace,
      prefetch: jest.fn(),
      events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
    });

    renderWithNextIntl(<LeadsDashboardPage />);

    const expanded = await screen.findAllByRole('button', { expanded: true });
    expect(expanded).toHaveLength(1);
    expect(expanded[0]).toHaveTextContent('hello@riverbank.pt');
  });

  it('explains a verdict the lead carries without asking the village', async () => {
    (fetchLeadsBoard as jest.Mock).mockResolvedValue({
      rows: [
        {
          ...villageLead,
          fit: {
            verdict: 'not_fit',
            explanation: {
              headline: 'Not a fit',
              detail: '1 answer rules this project out.',
              failing: [
                {
                  key: 'peopleCount',
                  label: 'People in the community',
                  tier: 'hard',
                  reason: '8, below the minimum of 10.',
                },
              ],
              unanswered: [],
            },
          },
        },
      ],
      total: 1,
    });
    renderWithNextIntl(<LeadsDashboardPage />);

    await userEvent.click(await screen.findByText('Riverbank Collective'));

    expect(screen.getByText('Why this verdict')).toBeInTheDocument();
    expect(
      screen.getByText('1 answer rules this project out.'),
    ).toBeInTheDocument();
    expect(screen.getByText('What to change')).toBeInTheDocument();
    expect(screen.getByText('People in the community')).toBeInTheDocument();
    expect(
      screen.getByText('8, below the minimum of 10.', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByText('What to ask')).not.toBeInTheDocument();
    expect(fetchVillageFit).not.toHaveBeenCalled();
  });

  it('reads the explanation off the village when the lead has none', async () => {
    (fetchVillageFit as jest.Mock).mockResolvedValue({
      verdict: 'needs_info',
      explanation: {
        headline: 'Needs info',
        detail: 'Two questions are still open.',
        failing: [],
        unanswered: [
          {
            key: 'hasLand',
            label: 'They hold the land',
            reason: 'Not answered yet.',
          },
        ],
      },
    });
    renderWithNextIntl(<LeadsDashboardPage />);
    await screen.findByText('Riverbank Collective');
    expect(fetchVillageFit).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Riverbank Collective'));

    expect(fetchVillageFit).toHaveBeenCalledWith('v-1');
    expect(await screen.findByText('What to ask')).toBeInTheDocument();
    expect(screen.getByText('They hold the land')).toBeInTheDocument();
    expect(screen.queryByText('What to change')).not.toBeInTheDocument();
  });

  it('shows only the verdict when the village cannot explain it', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);

    await userEvent.click(await screen.findByText('Riverbank Collective'));

    await waitFor(() => expect(fetchVillageFit).toHaveBeenCalledWith('v-1'));
    expect(screen.getByText('Fund eligible')).toBeInTheDocument();
    expect(screen.queryByText('Why this verdict')).not.toBeInTheDocument();
  });

  it('opens on every lead, unfiltered', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);

    await waitFor(() => expect(fetchLeadsBoard).toHaveBeenCalled());
    expect((fetchLeadsBoard as jest.Mock).mock.calls[0][0]).toEqual({
      page: 1,
      limit: 25,
    });
    expect(await screen.findByText('Riverbank')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('heads a village lead with the village and keeps the contact beneath it', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);

    const card = (await screen.findByText('Riverbank')).closest('button');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText('Riverbank')).toHaveClass(
      'font-medium',
    );
    expect(
      within(card as HTMLElement).getByText('Riverbank Collective'),
    ).toBeInTheDocument();
    expect(
      within(card as HTMLElement).getByText('hello@riverbank.pt'),
    ).toBeInTheDocument();
    // The name is the title now, so the meta row does not repeat it.
    expect(within(card as HTMLElement).getAllByText('Riverbank')).toHaveLength(
      1,
    );
  });

  it('links every tab to its own route', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);
    await waitFor(() => expect(fetchLeadsBoard).toHaveBeenCalled());

    expect(screen.getByRole('link', { name: 'Villages' })).toHaveAttribute(
      'href',
      '/dashboard/leads/village',
    );
    expect(screen.getByRole('link', { name: 'Needs action' })).toHaveAttribute(
      'href',
      '/dashboard/leads/needs_action',
    );
  });

  it('refetches with the tab in the route', async () => {
    const { rerender } = renderWithNextIntl(<LeadsDashboardPage />);
    await waitFor(() => expect(fetchLeadsBoard).toHaveBeenCalled());

    setTab('village');
    rerender(<LeadsDashboardPage />);

    await waitFor(() =>
      expect(fetchLeadsBoard).toHaveBeenCalledWith({
        type: 'village',
        page: 1,
        limit: 25,
      }),
    );
    expect(screen.getByRole('link', { name: 'Villages' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('sends the bare dashboard path to the default tab', () => {
    renderWithNextIntl(<LeadsDashboardIndexPage />);

    expect(routerReplace).toHaveBeenCalledWith('/dashboard/leads/all');
  });

  it('falls back to the unfiltered view for a tab it does not know', async () => {
    setTab('nonsense');
    renderWithNextIntl(<LeadsDashboardPage />);

    await waitFor(() => expect(fetchLeadsBoard).toHaveBeenCalled());
    expect((fetchLeadsBoard as jest.Mock).mock.calls[0][0]).toEqual({
      page: 1,
      limit: 25,
    });
  });

  it('carries the search into the query once typing settles', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);
    await waitFor(() => expect(fetchLeadsBoard).toHaveBeenCalled());

    await userEvent.type(screen.getByLabelText('Search'), 'river');

    await waitFor(() =>
      expect(fetchLeadsBoard).toHaveBeenCalledWith({
        q: 'river',
        page: 1,
        limit: 25,
      }),
    );
  });

  it('flags a brief the model never wrote', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);

    const fallbackCard = (await screen.findByText('Ada Lovelace')).closest(
      'div.bg-white',
    ) as HTMLElement;
    expect(
      within(fallbackCard).getByText('Written without AI'),
    ).toBeInTheDocument();

    const aiCard = screen
      .getByText('Riverbank Collective')
      .closest('div.bg-white') as HTMLElement;
    expect(within(aiCard).queryByText('Written without AI')).toBeNull();
  });

  it('names the owner rather than showing a raw id', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);

    expect(await screen.findByText('Owner: Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('gives a manager the owner picker', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);
    await userEvent.click(await screen.findByText('Riverbank Collective'));

    const picker = await screen.findByLabelText('Owner');
    await userEvent.selectOptions(picker, 'amb-2');

    await waitFor(() =>
      expect(patchLead).toHaveBeenCalledWith('lead-1', {
        managedBy: ['amb-2'],
      }),
    );
  });

  it('keeps the owner picker away from an ambassador', async () => {
    setUser(['ambassador']);
    renderWithNextIntl(<LeadsDashboardPage />);
    await userEvent.click(await screen.findByText('Riverbank Collective'));

    await screen.findByText('Researched facts');
    expect(screen.queryByLabelText('Owner')).toBeNull();
    expect(fetchLeadOwnerCandidates).not.toHaveBeenCalled();
  });

  it('lets admin and team re-run the enrichment job', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);
    await userEvent.click(await screen.findByText('Riverbank Collective'));

    await userEvent.click(
      await screen.findByRole('button', { name: 'Re-run enrichment' }),
    );
    await waitFor(() => expect(enrichLead).toHaveBeenCalledWith('lead-1'));
  });

  it('keeps enrichment and link rebuilding away from an ambassador', async () => {
    setUser(['ambassador']);
    renderWithNextIntl(<LeadsDashboardPage />);
    await userEvent.click(await screen.findByText('Riverbank Collective'));

    await screen.findByText('Researched facts');
    expect(
      screen.queryByRole('button', { name: 'Re-run enrichment' }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rebuild links' })).toBeNull();
  });

  it('shows the enrichment as suggestions and never writes them itself', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);
    await userEvent.click(await screen.findByText('Riverbank Collective'));

    expect(await screen.findByText('Who owns the land?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Suggestions only — confirm each one on the village before it counts.',
      ),
    ).toBeInTheDocument();

    // Nothing about opening the card may write criteria anywhere.
    expect(patchLead).not.toHaveBeenCalled();
  });

  it('stamps the contact date when a call is logged', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);
    await userEvent.click(await screen.findByText('Riverbank Collective'));

    await userEvent.click(
      await screen.findByRole('button', { name: 'Log a contact' }),
    );

    await waitFor(() => expect(patchLead).toHaveBeenCalled());
    const [id, payload] = (patchLead as jest.Mock).mock.calls[0];
    expect(id).toBe('lead-1');
    expect(typeof payload.lastContactedAt).toBe('string');
  });

  it('saves notes on blur, and only the field that changed', async () => {
    renderWithNextIntl(<LeadsDashboardPage />);
    await userEvent.click(await screen.findByText('Riverbank Collective'));

    const notes = await screen.findByLabelText('Notes');
    await userEvent.clear(notes);
    await userEvent.type(notes, 'called twice');
    await userEvent.tab();

    await waitFor(() =>
      expect(patchLead).toHaveBeenCalledWith('lead-1', {
        notes: 'called twice',
      }),
    );
  });

  it('says so when the board cannot be loaded', async () => {
    (fetchLeadsBoard as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Leads are off' } },
    });
    renderWithNextIntl(<LeadsDashboardPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Leads are off');
  });

  it('says so when the board is empty', async () => {
    (fetchLeadsBoard as jest.Mock).mockResolvedValue({ rows: [], total: 0 });
    renderWithNextIntl(<LeadsDashboardPage />);

    expect(
      await screen.findByText('No leads match this filter.'),
    ).toBeInTheDocument();
  });

  it('keeps the page away from a user without the RBAC key', async () => {
    (useRBAC as jest.Mock).mockReturnValue({ hasAccess: () => false });
    renderWithNextIntl(<LeadsDashboardPage />);

    expect(fetchLeadsBoard).not.toHaveBeenCalled();
  });
});
