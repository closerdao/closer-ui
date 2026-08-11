import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';

import { AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';

import { loadLocaleData } from '../utils/locale.helpers';

type Props = {
  initialMessages: AbstractIntlMessages;
  children: ReactNode;
  timeZone: string;
  onError?: (error: Error & { code?: string }) => void;
};

export default function LocaleMessagesNextIntlBridge({
  initialMessages,
  children,
  timeZone,
  onError,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] =
    useState<AbstractIntlMessages>(initialMessages);

  useEffect(() => {
    let cancelled = false;
    const locale = router.locale || 'en';
    loadLocaleData(locale, process.env.NEXT_PUBLIC_APP_NAME).then((m) => {
      if (!cancelled) setMessages(m as AbstractIntlMessages);
    });
    return () => {
      cancelled = true;
    };
  }, [router.locale]);

  return (
    <NextIntlClientProvider
      locale={router.locale || 'en'}
      messages={messages}
      timeZone={timeZone}
      onError={(error) => {
        // next-intl's default onError logs missing/invalid messages. Supplying
        // our own handler replaces that default, so a missing key would render
        // as the raw key path with nothing in the console. Keep the log (dev
        // only, to avoid noisy production consoles) before delegating.
        if (process.env.NODE_ENV !== 'production') {
          console.error(error);
        }
        onError?.(error as Error & { code?: string });
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
