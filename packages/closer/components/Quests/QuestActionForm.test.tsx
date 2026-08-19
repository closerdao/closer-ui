import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import QuestActionForm from './QuestActionForm';

const actionQuest = (trigger?: { event: string }): any => ({
  _id: 'q1',
  title: 'Buy a token',
  slug: 'buy-a-token',
  type: 'singleAction',
  status: 'live',
  start: new Date(Date.now() - 86400000).toISOString(),
  end: new Date(Date.now() + 86400000).toISOString(),
  actionConfig: {
    actionLabel: 'Buy a token',
    proofType: 'url',
    ...(trigger ? { trigger } : {}),
  },
});

const render = (quest: any) =>
  renderWithNextIntl(
    <QuestActionForm
      quest={quest}
      me={null}
      myActions={[]}
      onSubmitted={() => undefined}
    />,
  );

describe('QuestActionForm', () => {
  test('offers no submit button when the backend counts the actions', () => {
    const { container } = render(actionQuest({ event: 'token.purchased' }));
    expect(container).toBeEmptyDOMElement();
  });

  test('still takes proof for a custom trigger', () => {
    render(actionQuest({ event: 'custom' }));
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  test('keeps taking proof for a quest with no trigger set', () => {
    render(actionQuest());
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
});
