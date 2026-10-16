import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import { fetchUsersBySearchQuery } from '../../utils/searchUser';
import { addStayGuest, removeStayGuest } from '../../utils/stays.api';
import { fetchUsersByIds } from '../../utils/village.utils';
import BookingCoGuests from './BookingCoGuests';
import StayCoGuests from './StayCoGuests';

jest.mock('../../utils/searchUser', () => ({
  fetchUsersBySearchQuery: jest.fn(),
}));
jest.mock('../../utils/village.utils', () => ({
  fetchUsersByIds: jest.fn(),
}));
jest.mock('../../utils/stays.api', () => ({
  addStayGuest: jest.fn(),
  removeStayGuest: jest.fn(),
}));

const props = {
  stayId: 'stay_1',
  createdBy: 'owner',
  primaryGuest: { name: 'Alex' },
  guestIds: [],
  adults: 1,
  canEdit: true,
};
const guest = {
  _id: 'guest_1',
  screenname: 'James',
  photo: 'james',
  email: 'james@example.com',
};

beforeEach(() => {
  jest.clearAllMocks();
  (fetchUsersByIds as jest.Mock).mockResolvedValue([]);
  (fetchUsersBySearchQuery as jest.Mock).mockResolvedValue([guest]);
  (addStayGuest as jest.Mock).mockResolvedValue({});
  (removeStayGuest as jest.Mock).mockResolvedValue({});
});

test('a one-adult stay has no empty account-linking prompt or instruction to increase adults', () => {
  renderWithNextIntl(<StayCoGuests {...props} />);
  expect(
    screen.queryByRole('button', { name: 'Link profile for Guest 2' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Alex' })).toBeVisible();
  expect(screen.queryByText('Guest 2')).not.toBeInTheDocument();
  expect(addStayGuest).not.toHaveBeenCalled();
});

test('links and removes an account within the existing adult allowance', async () => {
  const user = userEvent.setup();
  const onGuestsChange = jest.fn();
  renderWithNextIntl(
    <StayCoGuests {...props} adults={2} onGuestsChange={onGuestsChange} />,
  );
  const addGuest = screen.getByRole('button', {
    name: 'Link profile for Guest 2',
  });
  expect(addGuest).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  await user.click(addGuest);
  const search = screen.getByRole('textbox', {
    name: 'Link guest account (optional)',
  });
  expect(search).toHaveFocus();
  expect(
    screen.getByRole('button', { name: 'Cancel linking profile for Guest 2' }),
  ).toHaveAttribute('aria-expanded', 'true');
  expect(screen.queryByText(/\$presence/)).not.toBeInTheDocument();
  const help = screen.getByRole('button', {
    name: 'About linking guest accounts',
  });
  await user.hover(help);
  expect(screen.getByRole('tooltip')).toHaveTextContent(
    'This does not change the number of guests or the price.',
  );
  expect(screen.getByRole('tooltip')).toHaveTextContent('$presence');
  await user.unhover(help);
  await user.type(search, 'James');
  await user.click(
    await screen.findByRole('button', { name: /James.*james@/ }),
  );
  await waitFor(() =>
    expect(addStayGuest).toHaveBeenCalledWith('stay_1', 'guest_1'),
  );
  expect(onGuestsChange).toHaveBeenLastCalledWith(['guest_1']);
  expect(screen.getByRole('link', { name: 'James' })).toHaveAttribute(
    'href',
    '/members/guest_1',
  );
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Link profile for Guest 2' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/All additional guest spots/),
  ).not.toBeInTheDocument();

  await user.click(
    screen.getByRole('button', { name: 'Unlink profile for Guest 2' }),
  );
  await waitFor(() =>
    expect(removeStayGuest).toHaveBeenCalledWith('stay_1', 'guest_1'),
  );
  expect(onGuestsChange).toHaveBeenLastCalledWith([]);
  await user.click(
    screen.getByRole('button', { name: 'Link profile for Guest 2' }),
  );
  expect(
    screen.getByRole('textbox', { name: 'Link guest account (optional)' }),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Cancel linking profile for Guest 2' }),
  );
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Link profile for Guest 2' }),
  ).toHaveAttribute('aria-expanded', 'false');
});

test('keeps distinct guests with the same name visible, including in read-only mode', async () => {
  (fetchUsersByIds as jest.Mock).mockResolvedValue([
    guest,
    { ...guest, _id: 'guest_2' },
  ]);
  const stay = { ...props, adults: 3, guestIds: ['guest_1', 'guest_2'] };
  const { rerender } = renderWithNextIntl(<StayCoGuests {...stay} />);
  expect(
    screen.queryByRole('button', { name: 'Link profile for Guest 2' }),
  ).not.toBeInTheDocument();
  const links = await screen.findAllByRole('link', { name: 'James' });
  expect(links).toHaveLength(2);
  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    '/members/guest_1',
    '/members/guest_2',
  ]);
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  rerender(<StayCoGuests {...stay} adults={4} canEdit={false} />);
  expect(
    screen.queryByRole('button', { name: 'Link profile for Guest 2' }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'James' })).toHaveLength(2);
  expect(
    screen.queryByRole('button', { name: 'Unlink profile for Guest 2' }),
  ).not.toBeInTheDocument();
});

test('preserves an existing linked guest even if the adult count is now one', async () => {
  (fetchUsersByIds as jest.Mock).mockResolvedValue([guest]);
  renderWithNextIntl(<StayCoGuests {...props} guestIds={['guest_1']} />);
  expect(await screen.findByRole('link', { name: 'James' })).toBeVisible();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Increase the number of adults/),
  ).not.toBeInTheDocument();
});

test('booking creation still supports adding a guest beyond the initial adult count', async () => {
  const user = userEvent.setup();
  const onAdd = jest.fn(() => true);
  renderWithNextIntl(
    <BookingCoGuests
      guests={[]}
      adults={1}
      maxCoGuests={1}
      canEdit
      excludeUserIds={['owner']}
      onAdd={onAdd}
      onRemove={jest.fn()}
    />,
  );
  await user.type(screen.getByRole('textbox'), 'James');
  await user.click(
    await screen.findByRole('button', { name: /James.*james@/ }),
  );
  expect(onAdd).toHaveBeenCalledWith(guest);
  expect(
    screen.queryByText('Link guest account (optional)'),
  ).not.toBeInTheDocument();
});

test('links the selected empty row and keeps the row when its profile is unlinked', async () => {
  const user = userEvent.setup();
  renderWithNextIntl(<StayCoGuests {...props} adults={3} />);
  const row2 = screen.getByRole('group', { name: 'Guest 2' });
  const row3 = screen.getByRole('group', { name: 'Guest 3' });
  await user.click(
    within(row3).getByRole('button', { name: 'Link profile for Guest 3' }),
  );
  const search = within(row3).getByRole('textbox');
  expect(search).toHaveFocus();
  expect(within(row2).queryByRole('textbox')).not.toBeInTheDocument();
  await user.type(search, 'James');
  await user.click(
    await within(row3).findByRole('button', { name: /James.*james@/ }),
  );
  await waitFor(() =>
    expect(addStayGuest).toHaveBeenCalledWith('stay_1', 'guest_1'),
  );
  expect(within(row3).getByRole('link', { name: 'James' })).toBeVisible();
  expect(
    within(row2).getByRole('button', { name: 'Link profile for Guest 2' }),
  ).toBeVisible();
  await user.click(
    within(row3).getByRole('button', { name: 'Unlink profile for Guest 3' }),
  );
  await waitFor(() =>
    expect(removeStayGuest).toHaveBeenCalledWith('stay_1', 'guest_1'),
  );
  expect(
    within(row3).getByRole('button', { name: 'Link profile for Guest 3' }),
  ).toBeVisible();
  expect(screen.queryByText('Guest 4')).not.toBeInTheDocument();
});

test('keeps a separate payer out of the booked adult rows', () => {
  renderWithNextIntl(
    <StayCoGuests
      {...props}
      adults={2}
      paidBy="payer"
      payer={{ name: 'Taylor' }}
    />,
  );
  expect(screen.getByRole('link', { name: 'Alex' })).toHaveAttribute(
    'href',
    '/members/owner',
  );
  expect(screen.getByRole('link', { name: 'Taylor' })).toHaveAttribute(
    'href',
    '/members/payer',
  );
  expect(screen.getByText('Payer')).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Link profile for Guest 2' }),
  ).toBeVisible();
  expect(screen.queryByText('Guest 3')).not.toBeInTheDocument();
  expect(screen.queryByText(/Alex \+1/)).not.toBeInTheDocument();
});

test('keeps saved profile links when their profile details are unavailable', async () => {
  renderWithNextIntl(
    <StayCoGuests {...props} adults={2} guestIds={['guest_1']} />,
  );
  await waitFor(() =>
    expect(fetchUsersByIds).toHaveBeenCalledWith(['guest_1']),
  );
  expect(screen.getByRole('link', { name: 'Linked profile' })).toHaveAttribute(
    'href',
    '/members/guest_1',
  );
  expect(
    screen.queryByRole('button', { name: 'Link profile for Guest 2' }),
  ).not.toBeInTheDocument();
});

test('a failed link restores the empty row and allows retry without changing the guest count', async () => {
  (addStayGuest as jest.Mock).mockRejectedValueOnce(
    new Error('Could not link profile'),
  );
  const user = userEvent.setup();
  const onGuestsChange = jest.fn();
  renderWithNextIntl(
    <StayCoGuests {...props} adults={2} onGuestsChange={onGuestsChange} />,
  );
  await user.click(
    screen.getByRole('button', { name: 'Link profile for Guest 2' }),
  );
  await user.type(screen.getByRole('textbox'), 'James');
  await user.click(
    await screen.findByRole('button', { name: /James.*james@/ }),
  );
  await waitFor(() => expect(onGuestsChange).toHaveBeenLastCalledWith([]));
  expect(
    screen.getByRole('button', { name: 'Link profile for Guest 2' }),
  ).toBeEnabled();
  expect(screen.queryByRole('link', { name: 'James' })).not.toBeInTheDocument();
  expect(screen.queryByText('Guest 3')).not.toBeInTheDocument();
});
