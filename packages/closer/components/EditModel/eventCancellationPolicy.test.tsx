import { fireEvent, screen } from '@testing-library/react';

import models from '../../models';
import { renderWithNextIntl } from '../../test/utils';
import EditModel from './EditModel';

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'u1', roles: ['admin'] }, isAuthenticated: true }),
}));

const renderEventForm = (initialData: Record<string, unknown>) => {
  const view = renderWithNextIntl(
    <EditModel
      endpoint="/event"
      fields={models.event as any}
      initialData={{ name: 'Solstice', ...initialData }}
    />,
  );
  fireEvent.click(screen.getByText('tickets'));
  return view;
};

describe('event tickets tab cancellation policy', () => {
  it('offers the policy on a paid event', () => {
    renderEventForm({ paid: true });

    expect(screen.getByText('Ticket cancellation policy')).toBeInTheDocument();
    expect(
      screen.getByLabelText('More than 30 days before'),
    ).toBeInTheDocument();
    expect(screen.getByText('Cancellation policy note')).toBeInTheDocument();
  });

  it('hides it on a free event, where there is nothing to refund', () => {
    renderEventForm({ paid: false });

    expect(
      screen.queryByText('Ticket cancellation policy'),
    ).not.toBeInTheDocument();
  });

  it('loads a saved policy into the buckets', () => {
    renderEventForm({
      paid: true,
      cancellationPolicy: { default: 1, lastweek: 0.3 },
      cancellationPolicyDisclaimer: 'Refunds are handled by the host.',
    });

    expect(screen.getByLabelText('7 to 2 days before')).toHaveValue(30);
    expect(
      screen.getByDisplayValue('Refunds are handled by the host.'),
    ).toBeInTheDocument();
  });
});
