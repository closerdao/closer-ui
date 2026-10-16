import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import type { Stay } from '../../types/stay';
import {
  StayTokenPaymentSummary,
  StayUnstakedNightsInfo,
} from './StayTokenPaymentSummary';

const stay = {
  tokensTarget: { val: 8.669192, cur: 'TDF' },
  tokensStaked: { val: 8.669192, cur: 'TDF' },
  priceLock: {
    appliedTokens: { val: 10.836489, cur: 'TDF' },
    lines: {
      adjustment: {
        unstakedNights: {
          nights: [[2026, 278]],
          val: 50.57,
          cur: 'EUR',
          tokens: { val: 2.167298, cur: 'TDF' },
          waived: false,
        },
      },
    },
  },
} as Stay;

test('the incident shows the current requirement and completion, not the original allocation', () => {
  renderWithNextIntl(<StayTokenPaymentSummary stay={stay} />);
  expect(screen.getByText('TDF required')).toBeInTheDocument();
  expect(screen.getByText('TDF 8.67')).toBeInTheDocument();
  expect(screen.getByText('All required TDF is staked.')).toBeInTheDocument();
  expect(screen.queryByText(/10.84/)).not.toBeInTheDocument();
  expect(screen.queryByText('TDF still to stake')).not.toBeInTheDocument();
});

test('a real one-millionth outstanding stake remains visible', () => {
  renderWithNextIntl(
    <StayTokenPaymentSummary
      stay={{ ...stay, tokensStaked: { val: 8.669191, cur: 'TDF' } }}
    />,
  );
  expect(screen.getByText('TDF 0.000001')).toBeInTheDocument();
  expect(screen.getByText('TDF still to stake')).toBeInTheDocument();
  expect(
    screen.queryByText('All required TDF is staked.'),
  ).not.toBeInTheDocument();
});

test('the original allocation and reason are available through an accessible disclosure', async () => {
  const user = userEvent.setup();
  renderWithNextIntl(<StayUnstakedNightsInfo stay={stay} />);
  const button = screen.getByRole('button');
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  await user.click(button);
  expect(button).toHaveAttribute(
    'aria-describedby',
    screen.getByRole('tooltip').id,
  );
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    'staking deadline has passed',
  );
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    'Originally selected: TDF 10.84. Required now: TDF 8.67.',
  );
  fireEvent.keyDown(button, { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  expect(button).toHaveFocus();
});

test('a waived conversion is described as waived, not due', () => {
  const waived = JSON.parse(JSON.stringify(stay));
  waived.priceLock.lines.adjustment.unstakedNights.waived = true;
  renderWithNextIntl(<StayUnstakedNightsInfo stay={waived} />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('tooltip')).toHaveTextContent('has been waived');
  expect(screen.getByRole('tooltip')).not.toHaveTextContent('now payable');
});
