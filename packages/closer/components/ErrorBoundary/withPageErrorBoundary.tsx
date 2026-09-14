import React, { ComponentType, ReactElement } from 'react';

import PageError from '../PageError';
import ErrorBoundary from './ErrorBoundary';

const toMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unexpected error';
};

/**
 * Wraps a page component so that a render-time exception never takes the
 * whole route down.
 *
 * - On the server, React does not run error boundaries: any throw inside
 *   render bubbles up and Next/Vercel answers with a bare 500. We call the
 *   page function directly inside try/catch so the error is caught and a
 *   readable <PageError /> is rendered instead. (Calling a function component
 *   directly is safe here because the wrapper is itself a function component
 *   rendering synchronously; the hooks bind to the wrapper's fiber.)
 * - On the client we rely on a regular <ErrorBoundary />, which keeps the
 *   page's own hook tree intact so retries work.
 *
 * Static members such as `getInitialProps` are copied onto the wrapper.
 */
type PageWithStatics<P> = ((props: P) => ReactElement) & {
  displayName?: string;
  getInitialProps?: (ctx: any) => Promise<any> | any;
};

export default function withPageErrorBoundary<P extends object>(
  Page: ComponentType<P>,
  name = Page.displayName || Page.name || 'Page',
): PageWithStatics<P> {
  const Wrapped: PageWithStatics<P> = (props: P) => {
    if (typeof window === 'undefined') {
      try {
        return <>{(Page as (p: P) => React.ReactNode)(props)}</>;
      } catch (err) {
        console.error(`[withPageErrorBoundary] ${name} crashed during SSR:`, err);
        return <PageError error={toMessage(err)} />;
      }
    }
    return (
      <ErrorBoundary>
        <Page {...props} />
      </ErrorBoundary>
    );
  };
  Wrapped.displayName = `withPageErrorBoundary(${name})`;
  return Wrapped;
}
