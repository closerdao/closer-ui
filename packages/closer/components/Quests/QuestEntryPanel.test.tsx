import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import QuestEntryPanel from './QuestEntryPanel';

const quest: any = {
  _id: 'q1',
  title: 'The Citizen Raffle',
  slug: 'citizen-raffle',
  type: 'raffle',
  status: 'live',
  start: new Date(Date.now() - 86400000).toISOString(),
  end: new Date(Date.now() + 86400000).toISOString(),
  raffleConfig: {
    winnerCount: 1,
    ticketSources: [
      {
        key: 'token_purchase',
        label: '$TDF bought during the quest',
        ticketsPerUnit: 1,
        maxTickets: 5,
        verification: 'automatic',
        trigger: { event: 'token.purchased', filter: { token: 'TDF' } },
      },
    ],
  },
};

const render = (me: any, over: any = {}) =>
  renderWithNextIntl(
    <QuestEntryPanel
      quest={{ ...quest, ...over }}
      me={me}
      isAuthenticated
    />,
  );

describe('QuestEntryPanel', () => {
  test('never asks a qualifying member to join', () => {
    render(null);
    expect(screen.queryByText(/join this quest/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/entered automatically/i),
    ).toBeInTheDocument();
  });

  test('says who a role-gated quest is open to', () => {
    render(null, { roleRequired: ['citizen'] });
    expect(screen.getByText(/Open to citizen/)).toBeInTheDocument();
  });

  test('offers no way to opt in or out — entry is not negotiable', () => {
    render({ entry: { status: 'active', ticketCount: 2 } });
    expect(screen.queryByText(/withdraw/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('still explains a withdrawn entry if the API reports one', () => {
    render({ entry: { status: 'withdrawn', ticketCount: 0 } });
    expect(screen.getByText(/has been withdrawn/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('points an unearned source at where the ticket is won', () => {
    render({ entry: { status: 'active', ticketCount: 0 } });
    expect(screen.getAllByText(/Buy \$TDF/).length).toBeGreaterThan(0);
  });

  test('drops the source CTA once it is maxed out', () => {
    render({
      entry: {
        status: 'active',
        ticketCount: 5,
        ticketsBySource: { token_purchase: 5 },
      },
    });
    expect(screen.queryByText(/Buy \$TDF/)).not.toBeInTheDocument();
  });
});
