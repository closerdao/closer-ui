import {
  buildApplicationsWhere,
  buildCitizensWhere,
  countVotesForUserInWindow,
  evaluateCitizenAtRisk,
  evaluateCitizenVoting,
  isCitizenRole,
  isFoundingCitizen,
  mapUserToFunnelSignals,
  resolveCitizenshipFunnelConfig,
  scoreCitizenRecommendation,
  sortRecommendedByScore,
} from '../citizenFunnel.helpers';

describe('citizenFunnel.helpers', () => {
  const config = resolveCitizenshipFunnelConfig({
    enabled: true,
    isSpaceHostVouchRequired: true,
    minVouches: 3,
    minVouchingStayDuration: 14,
    tokensRequired: 30,
  });

  describe('isCitizenRole', () => {
    it('treats member and citizen as citizens', () => {
      expect(isCitizenRole(['member'])).toBe(true);
      expect(isCitizenRole(['citizen'])).toBe(true);
      expect(isCitizenRole(['team'])).toBe(false);
    });
  });

  describe('isFoundingCitizen', () => {
    it('uses citizenship date before cutoff', () => {
      expect(
        isFoundingCitizen(
          { citizenshipDate: '2024-12-18', created: '2025-01-01' },
          '2024-12-18',
        ),
      ).toBe(true);
      expect(
        isFoundingCitizen(
          { citizenshipDate: '2024-12-19', created: '2020-01-01' },
          '2024-12-18',
        ),
      ).toBe(false);
    });
  });

  describe('evaluateCitizenVoting', () => {
    it('passes when either DIP19 vote rule is met', () => {
      expect(evaluateCitizenVoting(1, 0, config)).toBe(true);
      expect(evaluateCitizenVoting(0, 3, config)).toBe(true);
      expect(evaluateCitizenVoting(0, 2, config)).toBe(false);
      expect(evaluateCitizenVoting(null, null, config)).toBe(null);
    });
  });

  describe('evaluateCitizenAtRisk', () => {
    const baseSignals = {
      userId: 'u1',
      roles: ['member'],
      tokenBalance: 30,
      financedTokens: 0,
      hasDelinquentFinancePlan: false,
      totalNights: 40,
      nightsInMaintenanceWindow: 28,
      vouchCount: 0,
      votesInPrimaryWindow: 1,
      votesInAltWindow: 1,
      created: '2025-01-01',
    };

    it('is healthy when all DIP19 rules pass', () => {
      const result = evaluateCitizenAtRisk(baseSignals, config);
      expect(result.isAtRisk).toBe(false);
      expect(result.reasons).toEqual([]);
    });

    it('flags presence, tokens, finance, and voting independently', () => {
      const result = evaluateCitizenAtRisk(
        {
          ...baseSignals,
          tokenBalance: 10,
          nightsInMaintenanceWindow: 10,
          hasDelinquentFinancePlan: true,
          votesInPrimaryWindow: 0,
          votesInAltWindow: 0,
        },
        config,
      );
      expect(result.isAtRisk).toBe(true);
      expect(result.reasons).toEqual([
        'presence',
        'tokens',
        'finance',
        'voting',
      ]);
    });

    it('exempts founding citizens from the token floor', () => {
      const result = evaluateCitizenAtRisk(
        {
          ...baseSignals,
          tokenBalance: 5,
          citizenshipDate: '2024-01-01',
        },
        config,
      );
      expect(result.isFoundingCitizen).toBe(true);
      expect(result.meetsTokens).toBe(true);
      expect(result.reasons).not.toContain('tokens');
    });
  });

  describe('scoreCitizenRecommendation', () => {
    it('averages nights and token progress', () => {
      const score = scoreCitizenRecommendation(7, 15, 14, 30);
      expect(score.nightsProgress).toBeCloseTo(0.5);
      expect(score.tokensProgress).toBeCloseTo(0.5);
      expect(score.score).toBeCloseTo(0.5);
    });

    it('caps progress at 1', () => {
      const score = scoreCitizenRecommendation(100, 100, 14, 30);
      expect(score.nightsProgress).toBe(1);
      expect(score.tokensProgress).toBe(1);
      expect(score.score).toBe(1);
    });
  });

  describe('countVotesForUserInWindow', () => {
    it('counts proposals where the user voted including abstain', () => {
      const now = new Date('2026-08-01');
      const count = countVotesForUserInWindow(
        [
          {
            votes: {
              yes: [{ userId: 'u1', votedAt: '2026-06-01' }],
            },
          },
          {
            votes: {
              abstain: [{ userId: 'u1', votedAt: '2025-09-01' }],
            },
          },
          {
            votes: {
              no: [{ userId: 'u2', votedAt: '2026-06-01' }],
            },
          },
        ],
        'u1',
        1,
        now,
      );
      expect(count).toBe(2);
    });
  });

  describe('query builders and sorting', () => {
    it('builds application and citizen filters', () => {
      expect(buildApplicationsWhere().$and).toHaveLength(2);
      expect(buildCitizensWhere()).toEqual({
        roles: { $in: ['member', 'citizen'] },
      });
    });

    it('sorts recommended by score then nights', () => {
      const sorted = sortRecommendedByScore([
        { score: 0.4, nights: 20, tokens: 5 },
        { score: 0.8, nights: 5, tokens: 30 },
        { score: 0.8, nights: 10, tokens: 20 },
      ]);
      expect(sorted.map((r) => r.nights)).toEqual([10, 5, 20]);
    });
  });

  describe('mapUserToFunnelSignals', () => {
    it('maps user stats into funnel signals', () => {
      const signals = mapUserToFunnelSignals({
        _id: 'abc',
        screenname: 'Ada',
        roles: ['member'],
        stats: { wallet: { tdf: 12 }, all_time: { presence: 9 } },
        vouched: [{}, {}],
        citizenship: { why: 'hello', appliedAt: '2025-01-01' },
      });
      expect(signals.userId).toBe('abc');
      expect(signals.tokenBalance).toBe(12);
      expect(signals.totalNights).toBe(9);
      expect(signals.vouchCount).toBe(2);
      expect(signals.citizenshipWhy).toBe('hello');
    });
  });
});
