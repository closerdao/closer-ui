import type { EngagementOpportunity } from '../../types/engagement';
import {
  bodyWordCount,
  buildEngagementListWhere,
  copyProviderKey,
  markdownLinks,
  opportunityDaysUntilExpiry,
  rewardCarrots,
} from '../engagement.helpers';

const at = (iso: string) => new Date(iso);

describe('opportunityDaysUntilExpiry', () => {
  const row: EngagementOpportunity = {
    _id: 'opp-1',
    status: 'queued',
    created: '2026-08-01T00:00:00.000Z',
  };

  it('counts down the 14 days the job gives a row before the sweep', () => {
    expect(opportunityDaysUntilExpiry(row, at('2026-08-01T00:00:00.000Z'))).toBe(
      14,
    );
    expect(opportunityDaysUntilExpiry(row, at('2026-08-12T00:00:00.000Z'))).toBe(
      3,
    );
  });

  it('never goes negative once the sweep is overdue', () => {
    expect(opportunityDaysUntilExpiry(row, at('2026-09-01T00:00:00.000Z'))).toBe(
      0,
    );
  });

  it('has no clock for rows that already left the queue or lack a date', () => {
    for (const status of [
      'dismissed',
      'contacted',
      'converted',
      'expired',
    ] as const) {
      expect(
        opportunityDaysUntilExpiry(
          { ...row, status },
          at('2026-08-02T00:00:00.000Z'),
        ),
      ).toBeNull();
    }
    expect(
      opportunityDaysUntilExpiry({ _id: 'opp-2', status: 'queued' }),
    ).toBeNull();
  });

  it('stops the clock on a stamp even if the status has not caught up', () => {
    expect(
      opportunityDaysUntilExpiry(
        { ...row, dismissedAt: '2026-08-02T00:00:00.000Z' },
        at('2026-08-02T00:00:00.000Z'),
      ),
    ).toBeNull();
    expect(
      opportunityDaysUntilExpiry(
        { ...row, contactedAt: '2026-08-02T00:00:00.000Z' },
        at('2026-08-02T00:00:00.000Z'),
      ),
    ).toBeNull();
  });
});

describe('markdownLinks', () => {
  it('pulls out the links the outreach renderer will turn into anchors', () => {
    expect(
      markdownLinks(
        'Come to [Regeneration Week](https://tdf.com/events/regen) or read [the update](/blog/tokenomics).',
      ),
    ).toEqual([
      { text: 'Regeneration Week', url: 'https://tdf.com/events/regen' },
      { text: 'the update', url: '/blog/tokenomics' },
    ]);
  });

  it('ignores prose that merely uses brackets', () => {
    expect(markdownLinks('Hi [GUEST_1], nothing to click here.')).toEqual([]);
  });
});

describe('bodyWordCount', () => {
  it('counts words so a curator can see the 150-250 target', () => {
    expect(bodyWordCount('  one two   three\n\nfour ')).toBe(4);
    expect(bodyWordCount('   ')).toBe(0);
  });
});

describe('copyProviderKey', () => {
  it('treats the fallback path as template copy, not AI copy', () => {
    expect(copyProviderKey('anthropic')).toBe(
      'engagement_copy_provider_anthropic',
    );
    for (const provider of ['deterministic', 'fallback', undefined]) {
      expect(copyProviderKey(provider)).toBe(
        'engagement_copy_provider_deterministic',
      );
    }
  });
});

describe('rewardCarrots', () => {
  it('clamps whatever the API stored to the carrot budget', () => {
    expect(rewardCarrots({ _id: 'a', reward: { amount: 2 } })).toBe(2);
    expect(rewardCarrots({ _id: 'a', reward: { amount: 9 } })).toBe(2);
    expect(rewardCarrots({ _id: 'a' })).toBe(0);
  });
});

describe('buildEngagementListWhere', () => {
  it('no longer asks for the retired host_notified status', () => {
    const serialised = JSON.stringify([
      buildEngagementListWhere(true, 'active', 'user-1'),
      buildEngagementListWhere(true, 'all_open', 'user-1'),
      buildEngagementListWhere(true, 'archive', 'user-1'),
      buildEngagementListWhere(false, 'active', 'user-1'),
    ]);

    expect(serialised).not.toContain('host_notified');
  });

  it('loads the rows that left the queue for the archive view', () => {
    expect(buildEngagementListWhere(true, 'archive', 'user-1')).toEqual({
      status: { $in: ['contacted', 'converted', 'dismissed', 'expired'] },
    });
  });

  it('scopes a non-manager to the rows they are assigned', () => {
    expect(buildEngagementListWhere(false, 'active', 'user-1')).toEqual({
      $and: [
        { managedBy: { $in: ['user-1'] } },
        { status: { $in: ['assigned', 'approved'] } },
      ],
    });
  });
});
