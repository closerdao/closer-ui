import type { Lead } from '../types/lead';
import {
  leadCanBeInvitedTo,
  leadConversationStarted,
  leadIsBlocked,
  leadJourney,
  leadPrimaryAction,
} from '../utils/leads.helpers';

/**
 * The one rule behind the one button on a lead row. Each state of a village
 * lead maps to exactly one next thing to do, in the order the team works
 * them; the board tests check the button, this checks the ladder.
 */
const base: Lead = {
  _id: 'lead-1',
  type: 'village',
  email: 'founder@example.org',
  managedBy: ['me'],
  applications: [{ _id: 'app-1', status: 'conversation' }],
  qualification: {
    isVillage: true,
    landOwned: true,
    communityForming: true,
    ecologicalAmbition: true,
    verdict: 'qualified',
  },
  programs: { closer: { invitedAt: '2026-09-10T10:00:00.000Z' } },
  villages: [
    {
      _id: 'v-1',
      name: 'Riverbank',
      isDraft: true,
      ownerInvitedAt: '2026-09-11T10:00:00.000Z',
      ownerClaimed: true,
    },
  ],
  emailsSent: [{ template: 'lead_next_step', at: '2026-09-12T10:00:00.000Z' }],
};

describe('leadPrimaryAction', () => {
  it('starts with taking the lead', () => {
    expect(leadPrimaryAction({ ...base, managedBy: [] })).toBe('start');
    // Held, but the application was never moved: still not started.
    expect(
      leadPrimaryAction({
        ...base,
        applications: [{ _id: 'app-1', status: 'open' }],
      }),
    ).toBe('start');
    // A village lead with no application counts once it has been contacted.
    expect(
      leadPrimaryAction({ ...base, applications: [], lastContactedAt: '' }),
    ).toBe('start');
    expect(
      leadConversationStarted({
        ...base,
        applications: [],
        lastContactedAt: '2026-09-01T10:00:00.000Z',
      }),
    ).toBe(true);
  });

  it('then the call: book it, then say it happened', () => {
    const fresh = { ...base, qualification: {}, programs: {} };
    expect(leadPrimaryAction(fresh)).toBe('schedule_call');
    expect(
      leadPrimaryAction({
        ...fresh,
        call: { scheduledAt: '2026-09-20T09:00:00.000Z' },
      }),
    ).toBe('call_done');
    expect(
      leadPrimaryAction({
        ...fresh,
        call: {
          scheduledAt: '2026-09-20T09:00:00.000Z',
          doneAt: '2026-09-20T09:40:00.000Z',
        },
      }),
    ).toBe('invite');
  });

  it('stops asking for a call once the answers are in or an invite went out', () => {
    // Worked before the call step existed: qualified, never "called".
    expect(leadPrimaryAction({ ...base, programs: {} })).toBe('invite');
    expect(leadPrimaryAction({ ...base, qualification: {} })).toBe('publish');
  });

  it('then invites, then walks the village onto the map', () => {
    expect(leadPrimaryAction({ ...base, programs: {} })).toBe('invite');
    expect(leadPrimaryAction({ ...base, villages: [] })).toBe('create_village');
    expect(
      leadPrimaryAction({
        ...base,
        villages: [{ _id: 'v-1', isDraft: true, ownerClaimed: false }],
      }),
    ).toBe('invite_owner');
    expect(leadPrimaryAction({ ...base, emailsSent: [] })).toBe('tell_us_more');
    expect(leadPrimaryAction(base)).toBe('publish');
    expect(
      leadPrimaryAction({
        ...base,
        villages: [{ ...base.villages![0], isDraft: false }],
      }),
    ).toBeNull();
  });

  it('never waits on the match criteria: running on Closer asks for none', () => {
    const ruledOut: Lead = {
      ...base,
      qualification: { landOwned: false, verdict: 'not_qualified' },
    };
    // Ruled out and not invited anywhere: Closer is still on offer.
    expect(leadPrimaryAction({ ...ruledOut, programs: {} })).toBe('invite');
    expect(leadIsBlocked({ ...ruledOut, programs: {} })).toBe(true);
    expect(leadCanBeInvitedTo(ruledOut, 'closer')).toBe(true);
    expect(leadCanBeInvitedTo(ruledOut, 'oasa_fund')).toBe(false);
    // Invited to run on Closer: a customer like any other, the path is open.
    expect(leadIsBlocked(ruledOut)).toBe(false);
    expect(leadPrimaryAction(ruledOut)).toBe('publish');
    // In the fund, then ruled out: nothing left to offer from the row.
    expect(
      leadPrimaryAction({
        ...ruledOut,
        programs: { oasa_fund: { invitedAt: '2026-09-10T10:00:00.000Z' } },
      }),
    ).toBeNull();
  });

  it('offers only the start on a member', () => {
    expect(leadPrimaryAction({ ...base, type: 'member', managedBy: [] })).toBe(
      'start',
    );
    expect(leadPrimaryAction({ ...base, type: 'member' })).toBeNull();
  });

  it('draws the start, the call and the program as steps on the journey', () => {
    const keys = leadJourney(base).map((step) => step.key);
    expect(keys).toEqual([
      'start',
      'call',
      'qualify',
      'program',
      'village',
      'owner',
      'tell_us_more',
      'publish',
    ]);
    const fresh = leadJourney({ ...base, managedBy: [], programs: {} });
    expect(fresh[0]).toEqual({
      key: 'start',
      done: false,
      available: true,
      blocked: false,
    });
    // The call waits for somebody to take the lead.
    expect(fresh[1]).toEqual({
      key: 'call',
      done: false,
      available: false,
      blocked: false,
    });
    expect(leadJourney(base)[1]).toEqual(
      expect.objectContaining({ key: 'call', done: false, available: true }),
    );
    expect(
      leadJourney({ ...base, call: { doneAt: '2026-09-20T09:40:00.000Z' } })[1]
        .done,
    ).toBe(true);
    // The program step never waits on the answers.
    expect(
      leadJourney({ ...base, qualification: {}, programs: {} })[3],
    ).toEqual({ key: 'program', done: false, available: true, blocked: false });
  });
});
