import { screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import * as questsApi from '../../utils/quests.api';
import QuestWinners from './QuestWinners';

jest.mock('../../utils/quests.api');

const mocked = questsApi as jest.Mocked<typeof questsApi>;

const quest = (results: any): any => ({
  _id: 'q1',
  title: 'The Citizen Raffle',
  slug: 'citizen-raffle',
  type: 'raffle',
  status: 'settled',
  results,
});

describe('QuestWinners', () => {
  beforeEach(() => {
    mocked.getQuestUsers.mockReset().mockResolvedValue([]);
  });

  test('puts a name to a winner the draw only recorded as an id', async () => {
    mocked.getQuestUsers.mockResolvedValue([
      { _id: 'u1', screenname: 'Luna Mangan', slug: 'luna' },
    ]);

    renderWithNextIntl(
      <QuestWinners quest={quest({ winners: [{ rank: 1, userId: 'u1' }] })} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Luna Mangan')).toBeInTheDocument(),
    );
    expect(mocked.getQuestUsers).toHaveBeenCalledWith(['u1']);
  });

  test('does not look up a winner the API already named', () => {
    renderWithNextIntl(
      <QuestWinners
        quest={quest({
          winners: [{ rank: 1, userId: 'u1', screenname: 'Luna Mangan' }],
        })}
      />,
    );

    expect(screen.getByText('Luna Mangan')).toBeInTheDocument();
    expect(mocked.getQuestUsers).not.toHaveBeenCalled();
  });

  test('tucks the hash and seed into fine print rather than the results', () => {
    renderWithNextIntl(
      <QuestWinners
        quest={quest({
          winners: [{ rank: 1, userId: 'u1', screenname: 'Luna Mangan' }],
          ticketsHash: 'a91f3c',
          drawSeed: '7f2e9d',
        })}
      />,
    );

    const finePrint = screen.getByText('How this draw can be checked');
    expect(finePrint.closest('details')).toBeInTheDocument();
    expect(finePrint.closest('details')).toHaveTextContent('a91f3c');
    expect(finePrint.closest('details')).toHaveTextContent('7f2e9d');
  });
});
