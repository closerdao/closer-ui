import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../test/utils';
import EventEmailAttendeesModal from './EventEmailAttendeesModal';
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  cdn: '',
  formatSearch: (where: unknown) => JSON.stringify(where),
}));

const mockedPost = jest.requireMock('../utils/api.js').default
  .post as jest.Mock;

const EVENT_ID = 'event123';
const DRAFT_KEY = `event-email-draft-${EVENT_ID}`;

describe('EventEmailAttendeesModal', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedPost.mockReset();
  });

  it('persists the draft to localStorage while typing', () => {
    renderWithNextIntl(
      <EventEmailAttendeesModal eventId={EVENT_ID} closeModal={jest.fn()} />,
    );

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Schedule update' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Write your message to attendees…'),
      { target: { value: 'Doors open at 6pm.' } },
    );

    const stored = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    expect(stored.subject).toBe('Schedule update');
    expect(stored.body).toBe('Doors open at 6pm.');
  });

  it('restores a stored draft when reopened', () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        subject: 'Saved subject',
        body: 'Saved body',
        linkText: '',
        linkUrl: '',
      }),
    );

    renderWithNextIntl(
      <EventEmailAttendeesModal eventId={EVENT_ID} closeModal={jest.fn()} />,
    );

    expect(screen.getByLabelText('Subject')).toHaveValue('Saved subject');
    expect(
      screen.getByPlaceholderText('Write your message to attendees…'),
    ).toHaveValue('Saved body');
  });

  it('sends the draft and clears it on success', async () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        subject: 'Hello',
        body: 'See you soon',
        linkText: 'Details',
        linkUrl: 'https://example.com/info',
      }),
    );
    mockedPost.mockResolvedValue({ data: { sent: 12 } });

    renderWithNextIntl(
      <EventEmailAttendeesModal eventId={EVENT_ID} closeModal={jest.fn()} />,
    );

    fireEvent.click(screen.getByText('Send email'));

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith(
        `/events/${EVENT_ID}/email-attendees`,
        {
          subject: 'Hello',
          body: 'See you soon',
          linkText: 'Details',
          linkUrl: 'https://example.com/info',
        },
      ),
    );

    expect(
      await screen.findByText('Your email was sent to 12 attendees.'),
    ).toBeInTheDocument();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('keeps the draft and shows the error when sending fails', async () => {
    mockedPost.mockRejectedValue(new Error('Network down'));

    renderWithNextIntl(
      <EventEmailAttendeesModal eventId={EVENT_ID} closeModal={jest.fn()} />,
    );

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Hi' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Write your message to attendees…'),
      { target: { value: 'Body' } },
    );
    fireEvent.click(screen.getByText('Send email'));

    expect(await screen.findByText(/Network down/)).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    expect(stored.subject).toBe('Hi');
  });
});
