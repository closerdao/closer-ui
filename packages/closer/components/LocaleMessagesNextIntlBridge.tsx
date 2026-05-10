import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';

import { AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';

import { handleDevMissingLocaleSync } from '../utils/devLocaleSync';
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
        handleDevMissingLocaleSync(error as Error & { code?: string });
        onError?.(error as Error & { code?: string });
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
