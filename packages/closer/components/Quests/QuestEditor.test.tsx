import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import QuestEditor from './QuestEditor';

const submit = () =>
  fireEvent.submit(document.querySelector('form') as HTMLFormElement);

/** The award-kind select also has an option labelled "Currency", so find the
 * currency picker by what it actually offers. */
const findCurrencySelect = () =>
  [...document.querySelectorAll('select')].find((select) =>
    [...select.options].some((option) => option.text.startsWith('Carrots')),
  ) as HTMLSelectElement | undefined;

describe('QuestEditor', () => {
  test('blocks a save with nothing filled in and says what is missing', async () => {
    renderWithNextIntl(<QuestEditor />);
    submit();

    await waitFor(() => {
      expect(
        screen.getAllByText('This one is required.').length,
      ).toBeGreaterThan(0);
    });
    expect(
      screen.getByText('Add at least one ticket source with a label.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/fields need attention/)).toBeInTheDocument();
  });

  test('rejects a window that closes before it opens', async () => {
    renderWithNextIntl(<QuestEditor />);
    submit();

    await waitFor(() => {
      expect(
        screen.getAllByText('This one is required.').length,
      ).toBeGreaterThan(0);
    });
    expect(
      screen.queryByText('The quest has to close after it opens.'),
    ).not.toBeInTheDocument();
  });

  test('an automatic ticket source has to name a trigger event', async () => {
    renderWithNextIntl(<QuestEditor />);
    submit();

    await waitFor(() => {
      expect(
        screen.getByText('An automatic source needs a trigger event.'),
      ).toBeInTheDocument();
    });
  });

  test('never asks for a ticket source key — it is minted from the label', () => {
    renderWithNextIntl(<QuestEditor />);
    expect(screen.queryByText('Key')).not.toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  test('freezes the terms once the quest is past scheduled', () => {
    renderWithNextIntl(
      <QuestEditor
        quest={
          {
            _id: 'q1',
            title: 'The Citizen Raffle',
            slug: 'citizen-raffle',
            type: 'raffle',
            status: 'live',
            start: '2026-09-01T09:00:00.000Z',
            end: '2026-09-08T09:00:00.000Z',
            raffleConfig: {
              ticketSources: [
                {
                  key: 'token_purchase',
                  label: '$TDF bought during the quest',
                  ticketsPerUnit: 1,
                  maxTickets: 5,
                  verification: 'automatic',
                },
              ],
              winnerCount: 1,
            },
          } as any
        }
      />,
    );

    expect(
      screen.getByText(/the terms members entered under are frozen/i),
    ).toBeInTheDocument();
    // Copy stays editable, the scoring rules do not.
    expect(screen.getByDisplayValue('The Citizen Raffle')).not.toBeDisabled();
    expect(
      screen.getByDisplayValue('$TDF bought during the quest'),
    ).toBeDisabled();
    expect(screen.queryByText('Add ticket source')).not.toBeInTheDocument();

    const selectFor = (label: string) =>
      screen
        .getByText(new RegExp(`^${label}`))
        .closest('.form-field')
        ?.querySelector('select') as HTMLSelectElement;
    expect(selectFor('Category')).toBeDisabled();
    expect(selectFor('Quest type')).toBeDisabled();
    expect(selectFor('Verification')).toBeDisabled();
    expect(selectFor('Status')).not.toBeDisabled();
  });
});

describe('QuestEditor — API conformance', () => {
  test('offers award currencies as a dropdown, not free text', () => {
    renderWithNextIntl(<QuestEditor bookingToken="TDF" fiatCurrency="EUR" />);

    fireEvent.click(
      screen.getByText('Award something for every scoring action'),
    );

    const select = findCurrencySelect();
    expect(select).toBeDefined();
    expect(
      [...(select as HTMLSelectElement).options].map((o) => o.text),
    ).toEqual(['Carrots 🥕', '$TDF', 'EUR']);
  });

  test('refuses a token prize on a quest that is not about token growth', async () => {
    renderWithNextIntl(<QuestEditor bookingToken="TDF" />);

    fireEvent.click(screen.getByText('Award something to every entrant'));
    const select = findCurrencySelect() as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'TDF' } });

    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Token prizes are only allowed on token growth quests.',
        ),
      ).toBeInTheDocument();
    });
  });

  test('only offers the statuses the lifecycle allows from here', () => {
    renderWithNextIntl(
      <QuestEditor
        quest={
          {
            _id: 'q1',
            title: 'Scheduled quest',
            slug: 'scheduled-quest',
            type: 'raffle',
            status: 'scheduled',
            start: '2026-09-01T09:00:00.000Z',
            end: '2026-09-08T09:00:00.000Z',
            raffleConfig: { ticketSources: [], winnerCount: 1 },
          } as any
        }
      />,
    );

    const select = screen
      .getByText('Status')
      .parentElement?.querySelector('select') as HTMLSelectElement;
    expect([...select.options].map((option) => option.value)).toEqual([
      'scheduled',
      'live',
      'cancelled',
    ]);
  });

  test('a locked quest cannot be moved back by editing', () => {
    renderWithNextIntl(
      <QuestEditor
        quest={
          {
            _id: 'q1',
            title: 'Locked quest',
            slug: 'locked-quest',
            type: 'raffle',
            status: 'locked',
            start: '2026-09-01T09:00:00.000Z',
            end: '2026-09-08T09:00:00.000Z',
            raffleConfig: { ticketSources: [], winnerCount: 1 },
          } as any
        }
      />,
    );

    const select = screen
      .getByText('Status')
      .parentElement?.querySelector('select') as HTMLSelectElement;
    expect([...select.options].map((option) => option.value)).toEqual([
      'locked',
    ]);
  });
});

describe('QuestEditor — ticket source triggers', () => {
  const triggerSelect = () =>
    [...document.querySelectorAll('select')].find((select) =>
      [...select.options].some((option) => option.text === 'Event booked'),
    ) as HTMLSelectElement;

  const verificationSelect = () =>
    [...document.querySelectorAll('select')].find((select) =>
      [...select.options].some((option) => option.text === 'Admin review'),
    ) as HTMLSelectElement;

  test('never offers custom directly — it follows from admin review', () => {
    renderWithNextIntl(<QuestEditor />);
    expect([...triggerSelect().options].map((o) => o.value)).toEqual([
      '',
      'booking.confirmed',
      'stay.completed',
      'token.purchased',
    ]);
  });

  test('an admin-reviewed source needs no trigger and explains itself', async () => {
    renderWithNextIntl(<QuestEditor />);
    fireEvent.change(verificationSelect(), { target: { value: 'admin' } });

    await waitFor(() =>
      expect(
        screen.getByText(/Members submit proof for this source/),
      ).toBeInTheDocument(),
    );
    expect(triggerSelect()).toBeUndefined();

    fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    await waitFor(() =>
      expect(
        screen.queryByText('An automatic source needs a trigger event.'),
      ).not.toBeInTheDocument(),
    );
  });

  test('a completed stay can be scoped to an event and to full duration', async () => {
    renderWithNextIntl(<QuestEditor />);
    fireEvent.change(triggerSelect(), { target: { value: 'stay.completed' } });

    await waitFor(() =>
      expect(screen.getByText('Which event (optional)')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Only when they stay the full duration'),
    ).toBeInTheDocument();
  });

  test('a booked event still demands which event', async () => {
    renderWithNextIntl(<QuestEditor />);
    fireEvent.change(triggerSelect(), {
      target: { value: 'booking.confirmed' },
    });

    await waitFor(() =>
      expect(screen.getByText('Which event')).toBeInTheDocument(),
    );
  });
});

describe('QuestEditor — singleAction triggers', () => {
  const typeSelect = () =>
    [...document.querySelectorAll('select')].find((select) =>
      [...select.options].some((option) => option.value === 'singleAction'),
    ) as HTMLSelectElement;

  const actionTriggerSelect = () =>
    [...document.querySelectorAll('select')].find((select) =>
      [...select.options].some((option) => option.value === 'custom'),
    ) as HTMLSelectElement;

  const asActionQuest = async () => {
    renderWithNextIntl(<QuestEditor />);
    fireEvent.change(typeSelect(), { target: { value: 'singleAction' } });
    await waitFor(() => expect(actionTriggerSelect()).toBeDefined());
  };

  test('offers the same sources a raffle listens for, plus custom', async () => {
    await asActionQuest();
    expect([...actionTriggerSelect().options].map((o) => o.value)).toEqual([
      'booking.confirmed',
      'stay.completed',
      'token.purchased',
      'custom',
    ]);
  });

  test('defaults to custom — proof submitted by hand, as it always was', async () => {
    await asActionQuest();
    expect(actionTriggerSelect().value).toBe('custom');
    expect(screen.getByText('Proof type')).toBeInTheDocument();
    expect(
      screen.getByText('Review each submission before it scores'),
    ).toBeInTheDocument();
  });

  test('a counted trigger asks for no proof and nothing to review', async () => {
    await asActionQuest();
    fireEvent.change(actionTriggerSelect(), {
      target: { value: 'token.purchased' },
    });

    await waitFor(() =>
      expect(screen.queryByText('Proof type')).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByText('Review each submission before it scores'),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/The backend counts these/)).toBeInTheDocument();
  });

  test('a booked event still demands which event', async () => {
    await asActionQuest();
    fireEvent.change(actionTriggerSelect(), {
      target: { value: 'booking.confirmed' },
    });

    await waitFor(() =>
      expect(screen.getByText('Which event')).toBeInTheDocument(),
    );

    fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    await waitFor(() =>
      expect(
        screen.getAllByText('This one is required.').length,
      ).toBeGreaterThan(0),
    );
  });

  test('a completed stay can be scoped to full duration', async () => {
    await asActionQuest();
    fireEvent.change(actionTriggerSelect(), {
      target: { value: 'stay.completed' },
    });

    await waitFor(() =>
      expect(
        screen.getByText('Only when they stay the full duration'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('Which event (optional)')).toBeInTheDocument();
  });
});

