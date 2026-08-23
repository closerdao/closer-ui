import React from 'react';
import { renderToString } from 'react-dom/server';

import { NextIntlClientProvider } from 'next-intl';

import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import withPageErrorBoundary from './withPageErrorBoundary';

const Crashing = (_props: { booking?: { total: number } }) => {
  const [n] = React.useState(1);
  const value = (undefined as unknown as { total: number }).total + n;
  return <div>{value}</div>;
};

const Healthy = ({ label }: { label: string }) => <div>ok {label}</div>;

describe('withPageErrorBoundary', () => {
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('renders the page normally when nothing throws', () => {
    const Page = withPageErrorBoundary(Healthy);
    renderWithNextIntl(<Page label="here" />);
    expect(screen.getByText('ok here')).toBeTruthy();
  });

  it('catches a render crash on the server and renders PageError instead', () => {
    const Page = withPageErrorBoundary(Crashing, 'Crashing');
    const { window: win } = global as any;
    delete (global as any).window;
    let html = '';
    try {
      html = renderToString(
        <NextIntlClientProvider locale="en" messages={{ page_error_title: 'Error' }}>
          <Page />
        </NextIntlClientProvider>,
      );
    } finally {
      (global as any).window = win;
    }
    expect(html).toContain('Error');
    expect(html).toContain('Cannot read properties of undefined');
    expect(consoleError).toHaveBeenCalled();
  });

  it('catches a render crash on the client with the error boundary', () => {
    const Page = withPageErrorBoundary(Crashing);
    renderWithNextIntl(<Page />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });
});
