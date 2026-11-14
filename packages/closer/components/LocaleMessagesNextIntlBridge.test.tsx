import { useRouter } from 'next/router';

import { render, screen, waitFor } from '@testing-library/react';
import { useTranslations } from 'next-intl';

import { loadLocaleData } from '../utils/locale.helpers';
import LocaleMessagesNextIntlBridge from './LocaleMessagesNextIntlBridge';

jest.mock('../utils/locale.helpers', () => ({ loadLocaleData: jest.fn() }));

const Greeting = () => <p>{useTranslations()('greeting')}</p>;

const renderAt = (locale: string, initialMessages = { greeting: 'Hello' }) => {
  (useRouter as jest.Mock).mockReturnValue({ locale });
  const ui = () => (
    <LocaleMessagesNextIntlBridge
      initialMessages={initialMessages}
      timeZone="UTC"
    >
      <Greeting />
    </LocaleMessagesNextIntlBridge>
  );
  const view = render(ui());
  return {
    switchTo: (next: string) => {
      (useRouter as jest.Mock).mockReturnValue({ locale: next });
      view.rerender(ui());
    },
  };
};

beforeEach(() => {
  (loadLocaleData as jest.Mock).mockReset();
});

it('keeps the catalog it hydrated with instead of downloading it again', () => {
  renderAt('en');

  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(loadLocaleData).not.toHaveBeenCalled();
});

it('loads the new catalog on a locale switch, and the first one on switching back', async () => {
  (loadLocaleData as jest.Mock).mockImplementation(async (locale: string) =>
    locale === 'pt' ? { greeting: 'Olá' } : { greeting: 'Hello' },
  );
  const { switchTo } = renderAt('en');

  switchTo('pt');
  expect(await screen.findByText('Olá')).toBeInTheDocument();

  switchTo('en');
  expect(await screen.findByText('Hello')).toBeInTheDocument();
  expect((loadLocaleData as jest.Mock).mock.calls.map(([l]) => l)).toEqual([
    'pt',
    'en',
  ]);
});

it('still loads when the page arrived without a catalog', async () => {
  (loadLocaleData as jest.Mock).mockResolvedValue({ greeting: 'Hello' });
  renderAt('en', {} as never);

  await waitFor(() =>
    expect(loadLocaleData).toHaveBeenCalledWith(
      'en',
      process.env.NEXT_PUBLIC_APP_NAME,
    ),
  );
});
