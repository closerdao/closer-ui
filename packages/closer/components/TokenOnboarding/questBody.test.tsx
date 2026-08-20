import { render, screen } from '@testing-library/react';

import { OnboardingBlock } from '../../constants/tokenOnboardingQuests';
import QuestBody from './QuestBody';

describe('QuestBody', () => {
  it('renders every block type the quest copy uses', () => {
    const blocks: OnboardingBlock[] = [
      { type: 'p', text: 'A wallet is a pair of **keys**.' },
      { type: 'subheading', text: 'Never' },
      { type: 'list', items: ['Photograph it', 'Type it into a website'] },
      { type: 'steps', items: ['Open metamask.io', 'Create a new wallet'] },
      { type: 'note', tone: 'warn', text: 'Nobody will ask for your phrase.' },
      { type: 'facts', items: [{ label: '1 token', value: '1 night / year' }] },
    ];

    render(<QuestBody blocks={blocks} />);

    expect(screen.getByText('keys')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Never' })).toBeInTheDocument();
    expect(screen.getByText('Photograph it')).toBeInTheDocument();
    // Steps are numbered in the markup, not by a list style.
    expect(screen.getByText('Open metamask.io')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(
      screen.getByText('Nobody will ask for your phrase.'),
    ).toBeInTheDocument();
    expect(screen.getByText('1 night / year')).toBeInTheDocument();
  });

  it('renders inline bold and code without leaking the markup', () => {
    render(
      <QuestBody
        blocks={[
          { type: 'p', text: 'Your address looks like `0x7f3a…c21b`, **share it**.' },
        ]}
      />,
    );

    const code = screen.getByText('0x7f3a…c21b');
    expect(code.tagName).toBe('CODE');
    expect(screen.getByText('share it').tagName).toBe('STRONG');
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });

  it('separates the warning tone from the neutral one', () => {
    const { container } = render(
      <QuestBody
        blocks={[
          { type: 'note', text: 'Neutral aside' },
          { type: 'note', tone: 'warn', text: 'Careful' },
        ]}
      />,
    );

    const notes = container.querySelectorAll('div[class*="border-l-"]');
    expect(notes).toHaveLength(2);
    expect(notes[0].className).toContain('border-accent');
    expect(notes[1].className).toContain('border-pending');
  });
});
