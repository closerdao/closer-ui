import type { ComponentProps } from 'react';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import type { EngagementOpportunity } from '../../types/engagement';
import EngagementOpportunityCard from './EngagementOpportunityCard';

const opportunity: EngagementOpportunity = {
  _id: 'opp-1',
  email: 'guest@example.com',
  emailType: 'next_step',
  cohort: 'recent',
  stage: 'repeat_guest',
  score: 78,
  priority: 'high',
  status: 'queued',
  created: '2026-08-20T10:00:00.000Z',
  subject: 'A quick note from the team',
  body: 'Hi Guest, ...',
  signals: {
    name: 'Guest',
    journeyHighlights: ['stayed 8 nights on the land', 'joined 2 events'],
    reasons: ['User has multiple paid stay signals.'],
  },
  recommendedNextSteps: ['Thank the user for being part of the place.'],
};

const renderCard = (
  overrides: Partial<ComponentProps<typeof EngagementOpportunityCard>> = {},
) => {
  const props = {
    opportunity,
    draft: {
      subject: 'A quick note from the team',
      body: 'Hi Guest, ...',
      ctaLink: '',
      ctaText: '',
      hostBrief: '',
    },
    rewardAmount: 1,
    isExpanded: false,
    isBusy: false,
    canApproveSend: true,
    onToggle: jest.fn(),
    onDraftChange: jest.fn(),
    onRewardChange: jest.fn(),
    onRewardBlur: jest.fn(),
    onPreview: jest.fn(),
    onApprove: jest.fn(),
    onDismiss: jest.fn(),
    onStatusChange: jest.fn(),
    ...overrides,
  };
  renderWithNextIntl(<EngagementOpportunityCard {...props} />);
  return props;
};

describe('EngagementOpportunityCard', () => {
  it('summarises the row without showing the draft form', () => {
    renderCard();

    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.getByText('guest@example.com')).toBeInTheDocument();
    expect(screen.getByText('Next step')).toBeInTheDocument();
    expect(screen.getByText('Repeat guest')).toBeInTheDocument();
    expect(screen.getByText('High · 78')).toBeInTheDocument();
    expect(screen.queryByLabelText('Subject line')).not.toBeInTheDocument();
  });

  it('opens the working panel when the summary is clicked', async () => {
    const props = renderCard();

    await userEvent.click(screen.getByRole('button', { expanded: false }));

    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it('lists the markdown links the outreach renderer will turn into anchors', () => {
    renderCard({
      isExpanded: true,
      draft: {
        subject: 'A quick note',
        body: 'Come to [Regeneration Week](https://tdf.com/events/regen).',
        ctaLink: '',
        ctaText: '',
        hostBrief: '',
      },
    });

    expect(
      screen.getByRole('link', { name: 'Regeneration Week' }),
    ).toHaveAttribute('href', 'https://tdf.com/events/regen');
  });

  it('flags template copy as needing an edit before it is sent', () => {
    renderCard({
      isExpanded: true,
      opportunity: {
        ...opportunity,
        aiMeta: { provider: 'fallback' },
      },
    });

    expect(
      screen.getByText('Template draft — edit before sending'),
    ).toBeInTheDocument();
  });

  it('explains where an AI draft got its voice', () => {
    renderCard({
      isExpanded: true,
      opportunity: {
        ...opportunity,
        aiMeta: {
          provider: 'anthropic',
          voice: { tags: ['visit', 'stay'], exampleIds: ['tdf-0243'] },
        },
      },
    });

    expect(screen.getByText('AI draft')).toBeInTheDocument();
    expect(
      screen.getByText('Why does it sound like this?'),
    ).toBeInTheDocument();
    expect(screen.getByText('tdf-0243')).toBeInTheDocument();
  });

  it('shows the journey highlights the email may quote once expanded', () => {
    renderCard({ isExpanded: true });

    expect(screen.getByText('Journey so far')).toBeInTheDocument();
    expect(
      screen.getByText('stayed 8 nights on the land'),
    ).toBeInTheDocument();
    expect(screen.getByText('joined 2 events')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject line')).toHaveValue(
      'A quick note from the team',
    );
  });

  it('hides approve & send from users who cannot send member email', () => {
    renderCard({ isExpanded: true, canApproveSend: false });

    expect(
      screen.queryByRole('button', { name: /approve & send/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /preview email/i }),
    ).toBeInTheDocument();
  });

  it('drops the action buttons on a row whose outcome is already recorded', () => {
    renderCard({
      isExpanded: true,
      opportunity: { ...opportunity, status: 'dismissed' },
    });

    expect(
      screen.queryByRole('button', { name: /approve & send/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^dismiss$/i }),
    ).not.toBeInTheDocument();
  });
});
