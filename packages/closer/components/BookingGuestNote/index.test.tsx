import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BookingGuestNote from '.';
import { renderWithNextIntl } from '../../test/utils';
import { updateStayOptions } from '../../utils/stays.api';

jest.mock('../../utils/stays.api', () => ({
  ...jest.requireActual('../../utils/stays.api'),
  updateStayOptions: jest.fn(),
}));

const mockedUpdate = updateStayOptions as jest.Mock;

describe('BookingGuestNote', () => {
  beforeEach(() => mockedUpdate.mockReset());

  it('shows the host the note from the guest', () => {
    renderWithNextIntl(<BookingGuestNote message="Bringing my own tent" />);

    expect(screen.getByText('Note from the guest')).toBeInTheDocument();
    expect(screen.getByText('Bringing my own tent')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the guest their own note', () => {
    renderWithNextIntl(<BookingGuestNote message="Late arrival" isOwnNote />);

    expect(screen.getByText('Notes for your host')).toBeInTheDocument();
  });

  it('renders nothing with no note and no way to add one', () => {
    renderWithNextIntl(<BookingGuestNote message="  " />);

    expect(screen.queryByTestId('booking-guest-note')).not.toBeInTheDocument();
  });

  it('saves an edited note through the stay options route', async () => {
    const onSaved = jest.fn();
    const updated = { _id: 'stay-1', message: 'Arriving at 22:00' };
    mockedUpdate.mockResolvedValue(updated);

    renderWithNextIntl(
      <BookingGuestNote
        message="Late arrival"
        isOwnNote
        stayId="stay-1"
        onSaved={onSaved}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Edit note' }));
    const field = screen.getByRole('textbox', { name: 'Notes for your host' });
    await userEvent.clear(field);
    await userEvent.type(field, '  Arriving at 22:00 ');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(updated));
    expect(mockedUpdate).toHaveBeenCalledWith('stay-1', {
      message: 'Arriving at 22:00',
    });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('offers to add a note when there is none yet', () => {
    renderWithNextIntl(<BookingGuestNote isOwnNote stayId="stay-1" />);

    expect(screen.getByText('No note yet.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add a note' }),
    ).toBeInTheDocument();
  });

  it('keeps the editor open and shows the error when saving fails', async () => {
    mockedUpdate.mockRejectedValue(
      new Error(
        'The note to your host can no longer be changed after check-in.',
      ),
    );

    renderWithNextIntl(
      <BookingGuestNote message="Late arrival" isOwnNote stayId="stay-1" />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Edit note' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText(/can no longer be changed after check-in/),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
