import { getFundraisingBubbleMessage } from '../fundraising.helpers';

const base = {
  isGoalReached: false,
  progressPercent: 10,
  daysLeft: 30,
  isLoading: false,
};

describe('getFundraisingBubbleMessage', () => {
  it('stays generic while the totals are still loading', () => {
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 0, isLoading: true }),
    ).toEqual({ key: 'invest_bubble_fundraising' });
  });

  it('falls back to the generic line early in a campaign', () => {
    expect(getFundraisingBubbleMessage(base)).toEqual({
      key: 'invest_bubble_fundraising',
    });
  });

  it('celebrates a reached milestone above everything else', () => {
    expect(
      getFundraisingBubbleMessage({
        ...base,
        isGoalReached: true,
        daysLeft: 1,
        progressPercent: 100,
      }),
    ).toEqual({ key: 'invest_bubble_goal_reached' });
  });

  it('counts down the final three days', () => {
    expect(getFundraisingBubbleMessage({ ...base, daysLeft: 3 })).toEqual({
      key: 'invest_bubble_days_left',
      values: { days: 3 },
    });
    expect(getFundraisingBubbleMessage({ ...base, daysLeft: 1 })).toEqual({
      key: 'invest_bubble_days_left',
      values: { days: 1 },
    });
  });

  it('calls the last day by name', () => {
    expect(getFundraisingBubbleMessage({ ...base, daysLeft: 0 })).toEqual({
      key: 'invest_bubble_last_day',
    });
  });

  it('lets the deadline outrank a strong percentage', () => {
    expect(
      getFundraisingBubbleMessage({ ...base, daysLeft: 2, progressPercent: 80 }),
    ).toEqual({ key: 'invest_bubble_days_left', values: { days: 2 } });
  });

  it('reports the highest threshold crossed', () => {
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 51 }),
    ).toEqual({ key: 'invest_bubble_over_percent', values: { percent: 50 } });
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 76.4 }),
    ).toEqual({ key: 'invest_bubble_over_percent', values: { percent: 75 } });
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 25 }),
    ).toEqual({ key: 'invest_bubble_over_percent', values: { percent: 25 } });
  });

  it('switches to "almost there" past 90%', () => {
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 93 }),
    ).toEqual({ key: 'invest_bubble_almost_there' });
  });

  it('says "almost" when a threshold is within reach', () => {
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 48 }),
    ).toEqual({ key: 'invest_bubble_almost_percent', values: { percent: 50 } });
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 71 }),
    ).toEqual({ key: 'invest_bubble_almost_percent', values: { percent: 75 } });
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 88 }),
    ).toEqual({ key: 'invest_bubble_almost_percent', values: { percent: 90 } });
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 21 }),
    ).toEqual({ key: 'invest_bubble_almost_percent', values: { percent: 25 } });
  });

  it('prefers "almost 50%" over "over 25%" in the gap between them', () => {
    // 45 is the first point where 50 is within reach; 44 is still "over 25%".
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 45 }),
    ).toEqual({ key: 'invest_bubble_almost_percent', values: { percent: 50 } });
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 44 }),
    ).toEqual({ key: 'invest_bubble_over_percent', values: { percent: 25 } });
  });

  it('switches from "almost" to "over" once the threshold is crossed', () => {
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 49.9 }),
    ).toEqual({ key: 'invest_bubble_almost_percent', values: { percent: 50 } });
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 50 }),
    ).toEqual({ key: 'invest_bubble_over_percent', values: { percent: 50 } });
  });

  it('stays generic below the first "almost" band', () => {
    expect(
      getFundraisingBubbleMessage({ ...base, progressPercent: 12 }),
    ).toEqual({ key: 'invest_bubble_fundraising' });
  });
});
