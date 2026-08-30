import {
  buildApplicationsWhere,
  buildCitizensWhere,
  buildWindowBookingsWhere,
  countVotesForUserInWindow,
  deriveApplicationStage,
  evaluateCitizenAtRisk,
  evaluateCitizenVoting,
  extractVouches,
  isCitizenRole,
  isFoundingCitizen,
  mapUserToFunnelSignals,
  resolveCitizenshipFunnelConfig,
  scoreCitizenRecommendation,
  sortRecommendedByScore,
  sumNightsByUser,
} from '../citizenFunnel.helpers';

describe('citizenFunnel.helpers', () => {
  const config = resolveCitizenshipFunnelConfig(
    {
      enabled: true,
      isSpaceHostVouchRequired: true,
      minVouches: 3,
      minVouchingStayDuration: 14,
      tokensRequired: 30,
    },
    30,
  );

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
      expect(result.presenceStatus).toBe('met');
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
      expect(result.presenceStatus).toBe('risk');
      expect(result.reasons).toEqual(
        expect.arrayContaining(['presence', 'tokens', 'finance', 'voting']),
      );
    });

    it('does not treat lifetime nights as window presence', () => {
      const result = evaluateCitizenAtRisk(
        {
          ...baseSignals,
          totalNights: 100,
          nightsInMaintenanceWindow: null,
        },
        config,
      );
      expect(result.meetsPresence).toBe(null);
      expect(result.presenceStatus).not.toBe('met');
      expect(result.reasons).not.toContain('presence');
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

  describe('deriveApplicationStage', () => {
    it('walks applied → presence → tokens → vouching → ready', () => {
      const base = {
        userId: 'u1',
        roles: [],
        tokenBalance: 0,
        financedTokens: 0,
        hasDelinquentFinancePlan: false,
        totalNights: 0,
        nightsInMaintenanceWindow: null,
        vouchCount: 0,
        votesInPrimaryWindow: null,
        votesInAltWindow: null,
      };
      expect(deriveApplicationStage(base, config)).toBe('applied');
      expect(
        deriveApplicationStage({ ...base, totalNights: 5 }, config),
      ).toBe('presence');
      expect(
        deriveApplicationStage(
          { ...base, totalNights: 14, tokenBalance: 10 },
          config,
        ),
      ).toBe('tokens');
      expect(
        deriveApplicationStage(
          { ...base, totalNights: 14, tokenBalance: 30, vouchCount: 1 },
          config,
        ),
      ).toBe('vouching');
      expect(
        deriveApplicationStage(
          { ...base, totalNights: 14, tokenBalance: 30, vouchCount: 3 },
          config,
        ),
      ).toBe('ready');
    });
  });

  describe('scoreCitizenRecommendation', () => {
    it('weights nights 60% and tokens 40% by default', () => {
      const score = scoreCitizenRecommendation(7, 15, 14, 30);
      expect(score.nightsProgress).toBeCloseTo(0.5);
      expect(score.tokensProgress).toBeCloseTo(0.5);
      expect(score.score).toBeCloseTo(0.5);
      expect(score.nightsShort).toBe(7);
      expect(score.tokensShort).toBe(15);
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

    it('returns null when vote data is missing or unusable', () => {
      expect(countVotesForUserInWindow(null, 'u1', 1)).toBe(null);
      expect(countVotesForUserInWindow(undefined, 'u1', 1)).toBe(null);
      expect(countVotesForUserInWindow([{}], 'u1', 1)).toBe(null);
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

  describe('window presence batching', () => {
    const now = new Date('2026-08-30T00:00:00.000Z');
    const windowStart = new Date('2024-08-30T00:00:00.000Z');

    it('only matches ended, checked-in, non-day-ticket stays in the window', () => {
      const where = buildWindowBookingsWhere(['a', 'b'], windowStart, now);
      expect(where.createdBy).toEqual({ $in: ['a', 'b'] });
      expect(where.status.$in).toEqual(['paid', 'checked-in', 'checked-out']);
      expect(where.checkedIn).toEqual({ $exists: true, $ne: null });
      expect(where.isDayTicket).toEqual({ $ne: true });
      expect(where.duration).toEqual({ $gt: 0 });
      expect(where.end).toEqual({
        $gte: windowStart.toISOString(),
        $lt: now.toISOString(),
      });
    });

    it('totals durations per user and zeroes users with no stay', () => {
      const totals = sumNightsByUser(
        [
          { createdBy: 'a', duration: 4 },
          { createdBy: 'a', duration: 6 },
          { createdBy: 'b', duration: 3 },
          { createdBy: 'someone-else', duration: 99 },
        ],
        ['a', 'b', 'c'],
      );
      expect(totals).toEqual({ a: 10, b: 3, c: 0 });
    });

    it('ignores rows with an unusable duration', () => {
      const totals = sumNightsByUser(
        [
          { createdBy: 'a', duration: 'not-a-number' },
          { createdBy: 'a', duration: -2 },
          { createdBy: 'a' },
          { createdBy: 'a', duration: 5 },
        ],
        ['a'],
      );
      expect(totals).toEqual({ a: 5 });
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

    it('pulls the wallet, KYC and citizenship detail the admin list shows', () => {
      const signals = mapUserToFunnelSignals({
        _id: 'abc',
        screenname: 'Ada',
        roles: ['member'],
        lastactive: '2026-08-20',
        walletAddress: '0xabc',
        kycPassed: true,
        subscription: { plan: 'wanderer' },
        stats: {
          wallet: { tdf: 12, presence: 40.5, sweat: 3 },
          all_time: { presence: 9 },
        },
        citizenship: {
          date: '2026-03-01',
          tokensToFinance: 20,
          totalToPayInFiat: 1500,
        },
      });
      expect(signals.presenceBalance).toBe(40.5);
      expect(signals.sweatBalance).toBe(3);
      expect(signals.kycPassed).toBe(true);
      expect(signals.walletAddress).toBe('0xabc');
      expect(signals.subscriptionPlan).toBe('wanderer');
      expect(signals.lastActive).toBe('2026-08-20');
      expect(signals.citizenshipTokensToFinance).toBe(20);
      expect(signals.citizenshipTotalToPayInFiat).toBe(1500);
    });

    it('defaults the new signals rather than reading undefined off them', () => {
      const signals = mapUserToFunnelSignals({ _id: 'abc', roles: [] });
      expect(signals.presenceBalance).toBe(0);
      expect(signals.sweatBalance).toBe(0);
      expect(signals.kycPassed).toBe(false);
      expect(signals.subscriptionPlan).toBe(null);
      expect(signals.citizenshipTokensToFinance).toBe(null);
      expect(signals.vouches).toEqual([]);
    });
  });

  describe('extractVouches', () => {
    it('reads plain arrays and Immutable lists alike', () => {
      const entries = [
        { vouchedBy: 'u1', vouchedAt: '2026-01-01', message: 'yes' },
      ];
      expect(extractVouches({ vouched: entries })).toEqual(entries);
      expect(extractVouches({ vouched: { toJS: () => entries } })).toEqual(
        entries,
      );
      expect(extractVouches({ vouched: { toArray: () => entries } })).toEqual(
        entries,
      );
      expect(extractVouches({})).toEqual([]);
    });

    it('fills missing vouch fields with null', () => {
      expect(extractVouches({ vouched: [{ vouchedBy: 'u1' }] })).toEqual([
        { vouchedBy: 'u1', vouchedAt: null, message: null },
      ]);
    });
  });
});
