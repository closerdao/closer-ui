import { act, fireEvent, screen } from '@testing-library/react';

import { renderWithProviders } from '../../test/utils';
import { FinanceApplicationCreateRequest } from '../../types';
import CitizenFinanceTokens from './index';

const MAX_FINANCING_MONTHS = 60;

const renderPanel = (
  application: Partial<FinanceApplicationCreateRequest> = {},
) => {
  const updateApplication = jest.fn();
  const merged: Partial<FinanceApplicationCreateRequest> = {
    iban: '',
    tokensToFinance: 30,
    durationInMonths: 36,
    totalToPayInFiat: 12000,
    ...application,
  };

  renderWithProviders(
    <CitizenFinanceTokens
      application={merged}
      updateApplication={updateApplication}
      downPaymentPercent={10}
      maxFinancingMonths={MAX_FINANCING_MONTHS}
      aprPercent={0}
      minMonthlyPayment={0}
      isAgreementAccepted={false}
      setIsAgreementAccepted={jest.fn()}
      isTokenTermsAccepted={false}
      setIsTokenTermsAccepted={jest.fn()}
      handleNext={jest.fn()}
      loading={false}
      isCitizenApplication={false}
    />,
  );

  return { updateApplication };
};

const summaryValueFor = (label: string) => {
  const row = screen.getByText(label).parentElement as HTMLElement;
  return row.lastElementChild?.textContent;
};

describe('CitizenFinanceTokens', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const flush = async () => {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  };

  it('runs the duration slider from 2 months to the configured maximum', async () => {
    renderPanel();
    await flush();

    const slider = screen.getByLabelText(
      /over how many months would you like to pay/i,
    ) as HTMLInputElement;

    expect(slider.type).toBe('range');
    expect(slider.min).toBe('2');
    expect(slider.max).toBe(String(MAX_FINANCING_MONTHS));
    expect(slider.value).toBe('36');
  });

  it('reports the dragged duration back to the application', async () => {
    const { updateApplication } = renderPanel();
    await flush();

    const slider = screen.getByLabelText(
      /over how many months would you like to pay/i,
    );

    fireEvent.change(slider, { target: { value: '18' } });

    expect(updateApplication).toHaveBeenCalledWith('durationInMonths', 18);
  });

  it.each([
    [2, '2 months'],
    [11, '11 months'],
    [12, '1 year'],
    [13, '1 year, 1 month'],
    [24, '2 years'],
    [30, '2 years, 6 months'],
    [60, '5 years'],
  ])('renders %i months as "%s"', async (months, expected) => {
    renderPanel({ durationInMonths: months });
    await flush();

    expect(summaryValueFor('Duration')).toBe(expected);
  });

  it('summarises the plan in a single card', async () => {
    // 12000 total, 10% down, 36 months => 1200 down, 10800/36 = 300 a month.
    renderPanel();
    await flush();

    expect(summaryValueFor('Token amount')).toBe('30 $TDF');
    expect(summaryValueFor('Duration')).toBe('3 years');
    expect(summaryValueFor('Monthly cost')).toContain('300');
    expect(summaryValueFor('Down payment')).toContain('1,200');
  });
});
