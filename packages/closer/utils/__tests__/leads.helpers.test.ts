import type { User } from '../../contexts/auth/types';
import type { Lead } from '../../types/lead';
import {
  buildLeadPatchPayload,
  buildLeadsQuery,
  dateInputValue,
  defaultLeadEmailTemplate,
  draftFieldsFromLead,
  fitCheckFromResponse,
  fitExplanationOf,
  fitVerdictColor,
  isLeadsManager,
  leadBriefIsFallback,
  leadCreateVillageHref,
  leadDisplayName,
  leadEmailTemplatesFrom,
  leadEmailTypeFor,
  leadIsRuledOut,
  leadJourney,
  leadNeedsFitExplanation,
  leadNextActionIsOverdue,
  leadOwnerIds,
  leadOwnerInvitedAt,
  leadQualificationVerdict,
  leadSentEmailAt,
  leadSuggestedCriteria,
  leadTitle,
  leadVillageIsDraft,
  leadsFromResponse,
  leadsTabPath,
  parseTags,
  resolveLeadPreset,
} from '../leads.helpers';

const asUser = (roles: string[]): User => ({ _id: 'u-1', roles } as User);

const lead = (overrides: Partial<Lead> = {}): Lead => ({
  _id: 'lead-1',
  ...overrides,
});

describe('isLeadsManager', () => {
  it('lets admin and team see the whole board', () => {
    expect(isLeadsManager(asUser(['admin']))).toBe(true);
    expect(isLeadsManager(asUser(['team']))).toBe(true);
  });

  it('scopes an ambassador out of the manager controls', () => {
    expect(isLeadsManager(asUser(['ambassador']))).toBe(false);
  });

  it('handles a signed-out or role-less user', () => {
    expect(isLeadsManager(null)).toBe(false);
    expect(isLeadsManager(asUser([]))).toBe(false);
  });
});

describe('buildLeadsQuery', () => {
  it('filters the default view down to leads that passed the fit check', () => {
    expect(buildLeadsQuery('needs_action', '')).toEqual({ verdict: 'fit' });
  });

  it('splits the two pipelines by type', () => {
    expect(buildLeadsQuery('village', '')).toEqual({ type: 'village' });
    expect(buildLeadsQuery('member', '')).toEqual({ type: 'member' });
  });

  it('finds the leads the job has never enriched', () => {
    expect(buildLeadsQuery('unenriched', '')).toEqual({ status: 'pending' });
  });

  it('sends nothing at all for the unfiltered view', () => {
    expect(buildLeadsQuery('all', '')).toEqual({});
  });

  it('carries the search into every preset, trimmed', () => {
    expect(buildLeadsQuery('village', '  riverbank ')).toEqual({
      type: 'village',
      q: 'riverbank',
    });
  });

  it('leaves a blank search off rather than filtering on an empty string', () => {
    expect(buildLeadsQuery('all', '   ')).toEqual({});
  });
});

describe('resolveLeadPreset', () => {
  it('reads the tab out of the route and lands unknown ones on the default', () => {
    expect(resolveLeadPreset('village')).toBe('village');
    expect(resolveLeadPreset(['member'])).toBe('member');
    expect(resolveLeadPreset(undefined)).toBe('all');
    expect(resolveLeadPreset('nonsense')).toBe('all');
  });

  it('routes each tab under the leads dashboard', () => {
    expect(leadsTabPath('needs_action')).toBe('/dashboard/leads/needs_action');
  });
});

describe('leadTitle', () => {
  it('heads a village lead with the village name', () => {
    expect(
      leadTitle(
        lead({
          type: 'village',
          villages: [{ _id: 'v', name: ' Riverbank ' }],
          applications: [{ _id: 'a', name: 'Riverbank Collective' }],
        }),
      ),
    ).toBe('Riverbank');
  });

  it('falls back to the person when a village lead has no village yet', () => {
    expect(leadTitle(lead({ type: 'village', email: 'ada@example.com' }))).toBe(
      'ada@example.com',
    );
  });

  it('leaves member leads headed with the person', () => {
    expect(
      leadTitle(
        lead({
          type: 'member',
          user: { _id: 'u', screenname: 'Ada' },
          villages: [{ _id: 'v', name: 'Riverbank' }],
        }),
      ),
    ).toBe('Ada');
  });
});

describe('fit explanation', () => {
  it('treats an explanation with nothing to say as absent', () => {
    expect(fitExplanationOf(undefined)).toBeNull();
    expect(fitExplanationOf({ verdict: 'fit', explanation: {} })).toBeNull();
    expect(
      fitExplanationOf({
        verdict: 'not_fit',
        explanation: { failing: [{ key: 'peopleCount', reason: '8' }] },
      }),
    ).toEqual({ failing: [{ key: 'peopleCount', reason: '8' }] });
  });

  it('asks the village only for a village lead with an unexplained verdict', () => {
    const village = { _id: 'v-1', name: 'Riverbank' };
    expect(
      leadNeedsFitExplanation(
        lead({
          type: 'village',
          fit: { verdict: 'not_fit' },
          villages: [village],
        }),
      ),
    ).toBe('v-1');
    expect(
      leadNeedsFitExplanation(
        lead({
          type: 'village',
          villages: [village],
          fit: { verdict: 'not_fit', explanation: { headline: 'Not a fit' } },
        }),
      ),
    ).toBeNull();
    expect(
      leadNeedsFitExplanation(lead({ type: 'village', villages: [village] })),
    ).toBeNull();
    expect(
      leadNeedsFitExplanation(
        lead({ type: 'member', fit: { verdict: 'fit' }, villages: [village] }),
      ),
    ).toBeNull();
  });

  it('unwraps the fit endpoint whether or not it nests under results', () => {
    expect(fitCheckFromResponse({ results: { verdict: 'fit' } })).toEqual({
      verdict: 'fit',
    });
    expect(fitCheckFromResponse({ verdict: 'fit' })).toEqual({
      verdict: 'fit',
    });
    expect(fitCheckFromResponse(null)).toBeNull();
  });
});

describe('leadDisplayName', () => {
  it('prefers the member, then the application, then the bare email', () => {
    expect(
      leadDisplayName(
        lead({
          user: { _id: 'u', screenname: 'Ada' },
          applications: [{ _id: 'a', name: 'Riverbank' }],
          email: 'ada@example.com',
        }),
      ),
    ).toBe('Ada');
    expect(
      leadDisplayName(
        lead({
          applications: [{ _id: 'a', name: 'Riverbank' }],
          email: 'ada@example.com',
        }),
      ),
    ).toBe('Riverbank');
    expect(leadDisplayName(lead({ email: 'ada@example.com' }))).toBe(
      'ada@example.com',
    );
    expect(leadDisplayName(lead())).toBe('');
  });
});

describe('leadOwnerIds', () => {
  it('reads the array the model stores and the single id the UI assigns', () => {
    expect(leadOwnerIds(lead({ managedBy: ['u-2'] }))).toEqual(['u-2']);
    expect(leadOwnerIds(lead({ managedBy: 'u-3' }))).toEqual(['u-3']);
    expect(leadOwnerIds(lead())).toEqual([]);
  });
});

describe('fitVerdictColor', () => {
  it('ranks the four verdicts', () => {
    expect(fitVerdictColor('fund_eligible')).toBe('green');
    expect(fitVerdictColor('fit')).toBe('blue');
    expect(fitVerdictColor('needs_info')).toBe('neutral');
    expect(fitVerdictColor('not_fit')).toBe('red');
  });

  it('falls back rather than crashing on a verdict the API added later', () => {
    expect(fitVerdictColor('something_new')).toBe('neutral');
    expect(fitVerdictColor(undefined)).toBe('neutral');
  });
});

describe('leadBriefIsFallback', () => {
  it('flags a brief the model never wrote', () => {
    expect(
      leadBriefIsFallback(lead({ aiMeta: { provider: 'fallback' } })),
    ).toBe(true);
    expect(
      leadBriefIsFallback(lead({ aiMeta: { provider: 'anthropic' } })),
    ).toBe(false);
    expect(leadBriefIsFallback(lead())).toBe(false);
  });
});

describe('leadNextActionIsOverdue', () => {
  const now = new Date('2026-09-02T12:00:00.000Z');

  it('is true once the promised date has passed', () => {
    expect(
      leadNextActionIsOverdue(
        lead({ nextActionAt: '2026-09-01T00:00:00.000Z' }),
        now,
      ),
    ).toBe(true);
  });

  it('is false for a future date, no date, or an unparseable one', () => {
    expect(
      leadNextActionIsOverdue(
        lead({ nextActionAt: '2026-09-10T00:00:00.000Z' }),
        now,
      ),
    ).toBe(false);
    expect(leadNextActionIsOverdue(lead(), now)).toBe(false);
    expect(
      leadNextActionIsOverdue(lead({ nextActionAt: 'not a date' }), now),
    ).toBe(false);
  });
});

describe('leadSuggestedCriteria', () => {
  it('reads the suggestions without ever producing a criteria payload', () => {
    const entries = leadSuggestedCriteria(
      lead({
        enrichment: {
          suggestedCriteria: {
            hasLand: {
              value: true,
              confidence: 0.8,
              sourceUrl: 'https://riverbank.pt',
            },
          },
        },
      }),
    );
    expect(entries).toEqual([
      {
        key: 'hasLand',
        value: true,
        confidence: 0.8,
        sourceUrl: 'https://riverbank.pt',
      },
    ]);
  });

  it('is empty when the job suggested nothing', () => {
    expect(leadSuggestedCriteria(lead())).toEqual([]);
  });
});

describe('leadsFromResponse', () => {
  it('falls back to the row count when the board omits a total', () => {
    expect(leadsFromResponse({ results: [{ _id: 'a' }] })).toEqual({
      rows: [{ _id: 'a' }],
      total: 1,
    });
  });

  it('survives an error body that is not a list at all', () => {
    expect(leadsFromResponse(null)).toEqual({ rows: [], total: 0 });
    expect(leadsFromResponse({ results: 'nope' })).toEqual({
      rows: [],
      total: 0,
    });
  });
});

describe('parseTags', () => {
  it('splits on commas and drops the empties', () => {
    expect(parseTags(' funded , , warm ')).toEqual(['funded', 'warm']);
    expect(parseTags('')).toEqual([]);
  });
});

describe('dateInputValue', () => {
  it('turns a stored timestamp into what a date input takes', () => {
    expect(dateInputValue('2026-09-02T10:30:00.000Z')).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
    expect(dateInputValue(undefined)).toBe('');
    expect(dateInputValue('not a date')).toBe('');
  });
});

describe('buildLeadPatchPayload', () => {
  const existing = lead({
    notes: 'called once',
    tags: ['warm'],
    nextActionAt: '2026-09-10T00:00:00.000Z',
  });

  it('sends nothing when nothing was edited', () => {
    expect(
      buildLeadPatchPayload(existing, draftFieldsFromLead(existing)),
    ).toEqual({});
  });

  it('sends only the field that changed', () => {
    const draft = { ...draftFieldsFromLead(existing), notes: 'called twice' };
    expect(buildLeadPatchPayload(existing, draft)).toEqual({
      notes: 'called twice',
    });
  });

  it('clears a date with null rather than an empty string', () => {
    const draft = { ...draftFieldsFromLead(existing), nextActionAt: '' };
    expect(buildLeadPatchPayload(existing, draft)).toEqual({
      nextActionAt: null,
    });
  });

  it('splits edited tags back into a list', () => {
    const draft = { ...draftFieldsFromLead(existing), tags: 'warm, funded' };
    expect(buildLeadPatchPayload(existing, draft)).toEqual({
      tags: ['warm', 'funded'],
    });
  });
});

describe('leadEmailTemplatesFrom', () => {
  it('keeps the templates the API names and falls back to the key', () => {
    expect(
      leadEmailTemplatesFrom({
        emailTemplates: [
          { key: 'lead_intro', name: 'Intro' },
          { key: 'lead_next_step' },
          { name: 'no key' } as any,
        ],
      }),
    ).toEqual([
      { key: 'lead_intro', name: 'Intro' },
      { key: 'lead_next_step', name: 'lead_next_step' },
    ]);
  });

  it('falls back to the lead_* send actions and leaves invite_owner out', () => {
    expect(
      leadEmailTemplatesFrom({
        sendActions: ['invite_owner', 'lead_intro', 'lead_next_step'],
      }),
    ).toEqual([
      { key: 'lead_intro', name: 'lead_intro' },
      { key: 'lead_next_step', name: 'lead_next_step' },
    ]);
  });

  it('is empty when the vocabulary has none', () => {
    expect(leadEmailTemplatesFrom(null)).toEqual([]);
    expect(leadEmailTemplatesFrom({})).toEqual([]);
  });
});

describe('defaultLeadEmailTemplate', () => {
  it('prefers lead_intro wherever the API lists it', () => {
    expect(
      defaultLeadEmailTemplate([
        { key: 'lead_next_step' },
        { key: 'lead_intro' },
      ]),
    ).toBe('lead_intro');
  });

  it('takes the first template when lead_intro is not offered', () => {
    expect(defaultLeadEmailTemplate([{ key: 'lead_next_step' }])).toBe(
      'lead_next_step',
    );
    expect(defaultLeadEmailTemplate([])).toBe('');
  });
});

describe('leadEmailTypeFor', () => {
  it('scopes a batch to the pipeline the tab shows', () => {
    expect(leadEmailTypeFor('village')).toBe('village');
    expect(leadEmailTypeFor('member')).toBe('member');
  });

  it('reaches everyone from any other tab', () => {
    expect(leadEmailTypeFor('all')).toBeUndefined();
    expect(leadEmailTypeFor('needs_action')).toBeUndefined();
    expect(leadEmailTypeFor('unenriched')).toBeUndefined();
  });
});

describe('qualification', () => {
  it('reads the stored verdict, else derives it from the answers', () => {
    expect(
      leadQualificationVerdict(lead({ qualification: { verdict: 'qualified' } })),
    ).toBe('qualified');
    expect(
      leadQualificationVerdict(
        lead({ qualification: { isVillage: true, landOwned: false } }),
      ),
    ).toBe('not_qualified');
    expect(
      leadQualificationVerdict(
        lead({
          qualification: {
            isVillage: true,
            landOwned: true,
            communityForming: true,
            ecologicalAmbition: true,
          },
        }),
      ),
    ).toBe('qualified');
    expect(leadQualificationVerdict(lead({ qualification: { isVillage: true } }))).toBe(
      'pending',
    );
    expect(leadQualificationVerdict(lead())).toBe('pending');
  });

  it('only rules out a village lead somebody answered no for', () => {
    expect(
      leadIsRuledOut(
        lead({ type: 'village', qualification: { verdict: 'not_qualified' } }),
      ),
    ).toBe(true);
    expect(
      leadIsRuledOut(lead({ type: 'village', qualification: { verdict: 'pending' } })),
    ).toBe(false);
    expect(
      leadIsRuledOut(
        lead({ type: 'member', qualification: { verdict: 'not_qualified' } }),
      ),
    ).toBe(false);
  });
});

describe('leadJourney', () => {
  const qualified = {
    isVillage: true,
    landOwned: true,
    communityForming: true,
    ecologicalAmbition: true,
    verdict: 'qualified',
  };
  const stateOf = (steps: ReturnType<typeof leadJourney>) =>
    Object.fromEntries(
      steps.map((step) => [
        step.key,
        step.done ? 'done' : step.blocked ? 'blocked' : step.available ? 'open' : 'waiting',
      ]),
    );

  it('is empty for a member lead', () => {
    expect(leadJourney(lead({ type: 'member' }))).toEqual([]);
  });

  it('starts with the questions and a draft village, both open', () => {
    expect(stateOf(leadJourney(lead({ type: 'village' })))).toEqual({
      qualify: 'open',
      village: 'open',
      owner: 'waiting',
      tell_us_more: 'waiting',
      publish: 'waiting',
    });
  });

  it('blocks everything but the questions once a no is given', () => {
    expect(
      stateOf(
        leadJourney(
          lead({ type: 'village', qualification: { isVillage: false } }),
        ),
      ),
    ).toEqual({
      qualify: 'blocked',
      village: 'blocked',
      owner: 'blocked',
      tell_us_more: 'blocked',
      publish: 'blocked',
    });
  });

  it('opens the invite with a village, and tell-us-more once the invite went out', () => {
    const village = { _id: 'v', name: 'Riverbank', isDraft: true };
    expect(
      stateOf(leadJourney(lead({ type: 'village', villages: [village] }))),
    ).toEqual({
      qualify: 'open',
      village: 'done',
      owner: 'open',
      tell_us_more: 'waiting',
      publish: 'open',
    });
    expect(
      stateOf(
        leadJourney(
          lead({
            type: 'village',
            villages: [{ ...village, ownerInvitedAt: '2026-09-01T00:00:00Z' }],
          }),
        ),
      ),
    ).toMatchObject({ owner: 'open', tell_us_more: 'open' });
  });

  it('is all done for a claimed, emailed village on the map', () => {
    expect(
      stateOf(
        leadJourney(
          lead({
            type: 'village',
            qualification: qualified,
            emailsSent: [{ template: 'lead_next_step', at: '2026-09-02T00:00:00Z' }],
            villages: [{ _id: 'v', isDraft: false, ownerClaimed: true }],
          }),
        ),
      ),
    ).toEqual({
      qualify: 'done',
      village: 'done',
      owner: 'done',
      tell_us_more: 'done',
      publish: 'done',
    });
  });
});

describe('lead village and email facts', () => {
  it('links the create page to the lead and its application, as a draft', () => {
    expect(
      leadCreateVillageHref(
        lead({ applications: [{ _id: 'app-1', name: 'Riverbank' }] }),
      ),
    ).toBe('/villages/create?lead=lead-1&draft=1&applicationId=app-1');
    expect(leadCreateVillageHref(lead())).toBe(
      '/villages/create?lead=lead-1&draft=1',
    );
  });

  it('reads a draft off the flag, or off visibility on an older API', () => {
    expect(leadVillageIsDraft({ _id: 'v', isDraft: true })).toBe(true);
    expect(leadVillageIsDraft({ _id: 'v', isDraft: false, visibility: 'private' })).toBe(false);
    expect(leadVillageIsDraft({ _id: 'v', visibility: 'private' })).toBe(true);
    expect(leadVillageIsDraft({ _id: 'v' })).toBe(false);
  });

  it('finds when a template last went out', () => {
    expect(
      leadSentEmailAt(
        lead({
          emailsSent: [
            { template: 'lead_intro', at: '2026-08-01T00:00:00Z' },
            { template: 'lead_next_step', at: '2026-08-02T00:00:00Z' },
            { template: 'lead_next_step', at: '2026-08-03T00:00:00Z' },
          ],
        }),
        'lead_next_step',
      ),
    ).toBe('2026-08-03T00:00:00Z');
    expect(leadSentEmailAt(lead(), 'lead_intro')).toBeNull();
  });

  it('reads the owner invite off the village, else off the timeline', () => {
    expect(
      leadOwnerInvitedAt(
        lead({ villages: [{ _id: 'v', ownerInvitedAt: '2026-09-01T00:00:00Z' }] }),
      ),
    ).toBe('2026-09-01T00:00:00Z');
    expect(
      leadOwnerInvitedAt(
        lead({
          villages: [{ _id: 'v' }],
          activity: [
            { kind: 'contacted', channel: 'call', at: '2026-08-30T00:00:00Z' },
            { kind: 'contacted', note: 'Sent invite_owner', at: '2026-08-31T00:00:00Z' },
          ],
        }),
      ),
    ).toBe('2026-08-31T00:00:00Z');
    expect(leadOwnerInvitedAt(lead({ villages: [{ _id: 'v' }] }))).toBeNull();
  });
});
