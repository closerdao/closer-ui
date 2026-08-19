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
    <QuestEntryPanel quest={{ ...quest, ...over }} me={me} isAuthenticated />,
  );

describe('QuestEntryPanel', () => {
  test('never asks a qualifying member to join', () => {
    render(null);
    expect(screen.queryByText(/join this quest/i)).not.toBeInTheDocument();
    expect(screen.getByText(/entered automatically/i)).toBeInTheDocument();
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

describe('QuestEntryPanel — singleAction quests', () => {
  const actionQuest = (over: any = {}): any => ({
    _id: 'q2',
    title: 'Tell the village story',
    slug: 'village-story',
    type: 'singleAction',
    status: 'live',
    start: new Date(Date.now() - 86400000).toISOString(),
    end: new Date(Date.now() + 86400000).toISOString(),
    actionConfig: {
      actionLabel: 'Publish a story',
      proofType: 'url',
      pointsPerAction: 10,
    },
    prize: { eachAction: { kind: 'currency', cur: 'carrots', val: 5 } },
    ...over,
  });

  const renderAction = (me: any, over: any = {}) =>
    renderWithNextIntl(
      <QuestEntryPanel
        quest={actionQuest(over)}
        me={me}
        totalTickets={100}
        isAuthenticated
      />,
    );

  test('leads with what the actions earned, not the points', () => {
    renderAction({
      entry: { status: 'active', actionCount: 3, points: 30 },
      rank: 4,
      odds: 0.2,
    });

    expect(screen.getByText('15 🥕')).toBeInTheDocument();
    expect(screen.getByText('earned so far')).toBeInTheDocument();
  });

  test('never shows odds — there is no draw to win', () => {
    renderAction({
      entry: { status: 'active', actionCount: 3, points: 30 },
      rank: 4,
      odds: 0.2,
    });

    expect(screen.queryByText('odds')).not.toBeInTheDocument();
    expect(screen.getByText('Rank')).toBeInTheDocument();
  });

  test('does not promise tickets on a quest that has none', () => {
    renderAction({ entry: { status: 'active', actionCount: 1, points: 10 } });
    expect(
      screen.getByText(/everything you submit counts/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/tickets land here/i)).not.toBeInTheDocument();
  });

  test('keeps points visible as the thing the ranking runs on', () => {
    renderAction({ entry: { status: 'active', actionCount: 3, points: 30 } });
    expect(screen.getByText('points')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  test('falls back to points when nothing can be totalled', () => {
    renderAction(
      { entry: { status: 'active', actionCount: 3, points: 30 } },
      { prize: { ranked: { '1': { kind: 'perk', title: 'A hug' } } } },
    );

    expect(screen.queryByText('earned so far')).not.toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('points')).toBeInTheDocument();
  });
});

describe('QuestEntryPanel — counted singleAction quests', () => {
  const countedQuest = (over: any = {}): any => ({
    _id: 'q3',
    title: 'Buy a token',
    slug: 'buy-a-token',
    type: 'singleAction',
    status: 'live',
    start: new Date(Date.now() - 86400000).toISOString(),
    end: new Date(Date.now() + 86400000).toISOString(),
    actionConfig: {
      actionLabel: 'Buy a token',
      proofType: 'automatic',
      trigger: { event: 'token.purchased', filter: { token: 'TDF' } },
    },
    prize: { eachAction: { kind: 'currency', cur: 'carrots', val: 5 } },
    ...over,
  });

  test('links a member to where the action actually happens', () => {
    renderWithNextIntl(
      <QuestEntryPanel
        quest={countedQuest()}
        me={{ entry: { status: 'active', actionCount: 1 } } as any}
        isAuthenticated
        bookingToken="TDF"
      />,
    );

    const cta = screen.getByText(/Buy \$TDF/).closest('a');
    expect(cta).toHaveAttribute('href', '/token');
  });

  test('says it is counted rather than promising a submission', () => {
    renderWithNextIntl(
      <QuestEntryPanel
        quest={countedQuest()}
        me={{ entry: { status: 'active', actionCount: 1 } } as any}
        isAuthenticated
        bookingToken="TDF"
      />,
    );

    expect(screen.getByText(/counted for you/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/everything you submit counts/i),
    ).not.toBeInTheDocument();
  });

  test('drops the link once the member has hit their cap', () => {
    renderWithNextIntl(
      <QuestEntryPanel
        quest={countedQuest({
          actionConfig: {
            actionLabel: 'Buy a token',
            proofType: 'automatic',
            maxActionsPerUser: 2,
            trigger: { event: 'token.purchased', filter: { token: 'TDF' } },
          },
        })}
        me={{ entry: { status: 'active', actionCount: 2 } } as any}
        isAuthenticated
        bookingToken="TDF"
      />,
    );

    expect(screen.queryByText(/Buy \$TDF/)).not.toBeInTheDocument();
  });
});

