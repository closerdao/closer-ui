import {
  MILESTONE_URGENCY_WINDOW_DAYS,
  computeMilestoneStates,
} from '../fundraising.helpers';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const inDays = (n: number) =>
  new Date(Date.now() + n * MS_PER_DAY).toISOString();

const milestone = (endInDays: number, goal = 10000) => [
  {
    id: 'm1',
    title: 'Milestone',
    goal,
    start: inDays(-30),
    end: inDays(endInDays),
  } as any,
];

const urgencyFor = (endInDays: number, raised = 1000) =>
  computeMilestoneStates(milestone(endInDays), raised).m1.urgency;

describe('milestone urgency banner', () => {
  it('stays hidden while the deadline is far off', () => {
    expect(urgencyFor(90)).toBe(false);
    expect(urgencyFor(MILESTONE_URGENCY_WINDOW_DAYS + 5)).toBe(false);
  });

  it('shows once the deadline is inside the window', () => {
    expect(urgencyFor(MILESTONE_URGENCY_WINDOW_DAYS - 1)).toBe(true);
    expect(urgencyFor(3)).toBe(true);
    expect(urgencyFor(0.5)).toBe(true);
  });

  it('stays hidden once the deadline has passed', () => {
    expect(urgencyFor(-2)).toBe(false);
  });

  it('stays hidden when the milestone is already funded', () => {
    expect(urgencyFor(3, 20000)).toBe(false);
  });
});
