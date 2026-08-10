import {
  generateApplicationFilter,
  getStartAndEndDate,
} from '../performance.utils';

const args = { fromDate: '', toDate: '', timeFrame: 'currentMonth' };

describe('generateApplicationFilter', () => {
  it('scopes to the selected period', () => {
    const { startDate, endDate } = getStartAndEndDate('currentMonth', '', '');
    const filter = generateApplicationFilter(args) as any;

    expect(filter.where.created).toEqual({
      $gte: startDate,
      $lte: endDate,
    });
  });

  it('drops the date clause for all time', () => {
    const filter = generateApplicationFilter({
      ...args,
      timeFrame: 'allTime',
    }) as any;

    expect(filter.where.created).toBeUndefined();
    expect(filter.where.status).toBeUndefined();
  });

  it('matches every listed status, so a step can count itself and the ones past it', () => {
    const filter = generateApplicationFilter({
      ...args,
      status: ['conversation', 'approved'],
    }) as any;

    expect(filter.where.status).toEqual({
      $in: ['conversation', 'approved'],
    });
  });

  it('omits the status clause when none is given', () => {
    expect(
      (generateApplicationFilter({ ...args, status: [] }) as any).where.status,
    ).toBeUndefined();
  });

  it('honours a custom range', () => {
    const { startDate, endDate } = getStartAndEndDate(
      'custom',
      '2026-01-01',
      '2026-01-31',
    );
    const filter = generateApplicationFilter({
      fromDate: '2026-01-01',
      toDate: '2026-01-31',
      timeFrame: 'custom',
    }) as any;

    expect(filter.where.created).toEqual({ $gte: startDate, $lte: endDate });
  });
});
