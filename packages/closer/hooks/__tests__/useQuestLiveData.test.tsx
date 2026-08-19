import { act, renderHook, waitFor } from '@testing-library/react';

import type { Quest } from '../../types/quest';
import * as questsApi from '../../utils/quests.api';
import { useQuestLiveData } from '../useQuestLiveData';

jest.mock('../../utils/quests.api');

const mocked = questsApi as jest.Mocked<typeof questsApi>;

const buildQuest = (over: Partial<Quest> = {}): Quest =>
  ({
    _id: 'q1',
    title: 'The Citizen Raffle',
    slug: 'citizen-raffle',
    type: 'raffle',
    status: 'live',
    start: new Date(Date.now() - 86400000).toISOString(),
    end: new Date(Date.now() + 86400000).toISOString(),
    raffleConfig: { ticketSources: [], winnerCount: 1, leaderboardSize: 5 },
    ...over,
  } as Quest);

describe('useQuestLiveData', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mocked.getQuestMe.mockReset().mockResolvedValue(null);
    mocked.getQuestLeaderboard.mockReset().mockResolvedValue(null);
    mocked.getMyQuestActions.mockReset().mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('pulls the standings again while the quest is open', async () => {
    renderHook(() =>
      useQuestLiveData({
        quest: buildQuest(),
        isAuthenticated: true,
        pollIntervalMs: 1000,
      }),
    );

    await waitFor(() =>
      expect(mocked.getQuestLeaderboard).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() =>
      expect(mocked.getQuestLeaderboard.mock.calls.length).toBeGreaterThan(1),
    );
  });

  test('stops pulling once the quest is closed', async () => {
    renderHook(() =>
      useQuestLiveData({
        quest: buildQuest({ status: 'settled' }),
        isAuthenticated: true,
        pollIntervalMs: 1000,
      }),
    );

    await waitFor(() =>
      expect(mocked.getQuestLeaderboard).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mocked.getQuestLeaderboard).toHaveBeenCalledTimes(1);
  });

  test('holds off while the tab is hidden', async () => {
    const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);

    renderHook(() =>
      useQuestLiveData({
        quest: buildQuest(),
        isAuthenticated: true,
        pollIntervalMs: 1000,
      }),
    );

    await waitFor(() =>
      expect(mocked.getQuestLeaderboard).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mocked.getQuestLeaderboard).toHaveBeenCalledTimes(1);
    hidden.mockRestore();
  });

  test('skips the leaderboard when a raffle switches it off', async () => {
    renderHook(() =>
      useQuestLiveData({
        quest: buildQuest({
          raffleConfig: {
            ticketSources: [],
            winnerCount: 1,
            showLeaderboard: false,
          },
        }),
        isAuthenticated: true,
      }),
    );

    await waitFor(() => expect(mocked.getQuestMe).toHaveBeenCalled());
    expect(mocked.getQuestLeaderboard).not.toHaveBeenCalled();
  });

  test('does not ask for a signed-out member entry', async () => {
    renderHook(() =>
      useQuestLiveData({ quest: buildQuest(), isAuthenticated: false }),
    );

    await waitFor(() =>
      expect(mocked.getQuestLeaderboard).toHaveBeenCalledTimes(1),
    );
    expect(mocked.getQuestMe).not.toHaveBeenCalled();
    expect(mocked.getMyQuestActions).not.toHaveBeenCalled();
  });
});
