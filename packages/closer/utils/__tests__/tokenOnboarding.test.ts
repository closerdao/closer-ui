import {
  TOKEN_ONBOARDING_TOTAL_CARROTS,
  getTokenOnboardingQuests,
} from '../../constants/tokenOnboardingQuests';
import api from '../api';
import { awardOnboardingCarrots } from '../tokenOnboarding.api';
import {
  buildOnboardingAwardPayload,
  carrotsEarned,
  carrotsForQuests,
  formatCarrots,
  isOnboardingComplete,
  isQuestUnlocked,
  nextQuestIndex,
  parseOnboardingProgress,
} from '../tokenOnboarding.helpers';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

const quests = getTokenOnboardingQuests({
  tokenSymbol: 'TDF',
  platformName: 'Traditional Dream Factory',
  networkName: 'Celo',
  gasToken: 'CELO',
  semanticUrl: 'traditionaldreamfactory.com',
});

const allIds = quests.map((quest) => quest.id);

describe('token onboarding carrot totals', () => {
  it('awards exactly the advertised total across every quest', () => {
    expect(carrotsForQuests(quests)).toBe(TOKEN_ONBOARDING_TOTAL_CARROTS);
  });

  it('rewards a fraction of a carrot at each step', () => {
    expect(quests.length).toBeGreaterThan(1);
    quests.forEach((quest) => {
      expect(quest.carrots).toBeGreaterThan(0);
      expect(quest.carrots).toBeLessThan(TOKEN_ONBOARDING_TOTAL_CARROTS);
      // Quarter-carrot grid, so every amount renders as a clean fraction.
      expect((quest.carrots * 4) % 1).toBe(0);
    });
  });

  it('sums claimed quests without floating point drift', () => {
    expect(carrotsEarned(['why-web3', 'what-is-a-wallet'], quests)).toBe(0.75);
    expect(carrotsEarned(allIds, quests)).toBe(TOKEN_ONBOARDING_TOTAL_CARROTS);
  });

  it('ignores unknown ids when summing', () => {
    expect(carrotsEarned(['not-a-quest'], quests)).toBe(0);
  });
});

describe('formatCarrots', () => {
  it('renders quarters as fraction glyphs', () => {
    expect(formatCarrots(0.25)).toBe('¼');
    expect(formatCarrots(0.5)).toBe('½');
    expect(formatCarrots(0.75)).toBe('¾');
    expect(formatCarrots(1.25)).toBe('1¼');
    expect(formatCarrots(3.5)).toBe('3½');
  });

  it('renders whole carrots plainly', () => {
    expect(formatCarrots(1)).toBe('1');
    expect(formatCarrots(5)).toBe('5');
  });

  it('falls back to a decimal for amounts off the quarter grid', () => {
    expect(formatCarrots(0.1)).toBe('0.1');
    expect(formatCarrots(1.3)).toBe('1.3');
  });

  it('handles empty and invalid amounts', () => {
    expect(formatCarrots(0)).toBe('0');
    expect(formatCarrots(-1)).toBe('0');
    expect(formatCarrots(NaN)).toBe('0');
  });
});

describe('parseOnboardingProgress', () => {
  it('reads a stored object', () => {
    expect(
      parseOnboardingProgress({ completed: ['why-web3'] }, quests).completed,
    ).toEqual(['why-web3']);
  });

  it('reads a stored JSON string', () => {
    expect(
      parseOnboardingProgress('{"completed":["why-web3"]}', quests).completed,
    ).toEqual(['why-web3']);
  });

  it('drops ids that no longer exist and de-duplicates', () => {
    const progress = parseOnboardingProgress(
      { completed: ['why-web3', 'retired-quest', 'why-web3', 42] },
      quests,
    );
    expect(progress.completed).toEqual(['why-web3']);
  });

  it('returns an empty flow for junk input', () => {
    expect(parseOnboardingProgress(null, quests).completed).toEqual([]);
    expect(parseOnboardingProgress('not json', quests).completed).toEqual([]);
    expect(parseOnboardingProgress({ completed: 'nope' }, quests).completed).toEqual(
      [],
    );
  });
});

describe('quest sequencing', () => {
  it('opens the first quest and locks the rest', () => {
    expect(isQuestUnlocked(0, [], quests)).toBe(true);
    expect(isQuestUnlocked(1, [], quests)).toBe(false);
  });

  it('unlocks a quest once its predecessor is claimed', () => {
    expect(isQuestUnlocked(1, [quests[0].id], quests)).toBe(true);
    expect(isQuestUnlocked(2, [quests[0].id], quests)).toBe(false);
  });

  it('points at the first unclaimed quest', () => {
    expect(nextQuestIndex([], quests)).toBe(0);
    expect(nextQuestIndex([quests[0].id], quests)).toBe(1);
    expect(nextQuestIndex(allIds, quests)).toBe(-1);
  });

  it('reports completion only when every quest is claimed', () => {
    expect(isOnboardingComplete(allIds.slice(0, -1), quests)).toBe(false);
    expect(isOnboardingComplete(allIds, quests)).toBe(true);
  });
});

describe('awardOnboardingCarrots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the quest id and its carrot amount', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { results: {} } });

    const result = await awardOnboardingCarrots(quests[0]);

    expect(api.post).toHaveBeenCalledWith('/carrots/award/onboarding', {
      questId: 'why-web3',
      amount: 0.25,
      currency: 'credits',
      reason: `Token onboarding quest: ${quests[0].title}`,
    });
    expect(result).toEqual({ status: 'awarded' });
  });

  it('treats a conflict as an existing award', async () => {
    (api.post as jest.Mock).mockRejectedValue({ response: { status: 409 } });
    await expect(awardOnboardingCarrots(quests[0])).resolves.toEqual({
      status: 'already-awarded',
    });
  });

  it('reports unavailable when the endpoint is missing', async () => {
    (api.post as jest.Mock).mockRejectedValue({ response: { status: 404 } });
    await expect(awardOnboardingCarrots(quests[0])).resolves.toEqual({
      status: 'unavailable',
    });
  });

  it('builds a payload that never claims more than the quest is worth', () => {
    quests.forEach((quest) => {
      expect(buildOnboardingAwardPayload(quest).amount).toBe(quest.carrots);
    });
  });
});
