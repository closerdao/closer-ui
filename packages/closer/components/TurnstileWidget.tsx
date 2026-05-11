import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (error: unknown) => void;
          'expired-callback'?: () => void;
          action?: string;
          size?: 'normal' | 'compact' | 'flexible';
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const TURNSTILE_SITE_KEY = (
  process.env.NEXT_PUBLIC_CLOUDFLARE_KEY ?? ''
).trim();

interface TurnstileWidgetProps {
  action?: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  size?: 'normal' | 'compact' | 'flexible';
}

const SCRIPT_POLL_MS = 100;
const SCRIPT_POLL_MAX_MS = 30000;

const TurnstileWidget = ({
  action = 'submit',
  onVerify,
  onError,
  onExpire,
  size = 'flexible',
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const noSiteKeyBypassCalled = useRef(false);

  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (TURNSTILE_SITE_KEY) return;
    if (noSiteKeyBypassCalled.current) return;
    noSiteKeyBypassCalled.current = true;
    onVerifyRef.current('unconfigured-client-bypass');
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      return;
    }

    let cancelled = false;

    const markLoaded = () => {
      if (!cancelled) {
        setIsLoaded(true);
      }
    };

    if (window.turnstile) {
      markLoaded();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]',
    );
    if (existingScript) {
      const started = Date.now();
      const checkLoaded = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkLoaded);
          markLoaded();
        } else if (Date.now() - started > SCRIPT_POLL_MAX_MS) {
          clearInterval(checkLoaded);
          onErrorRef.current?.();
        }
      }, SCRIPT_POLL_MS);
      return () => {
        cancelled = true;
        clearInterval(checkLoaded);
      };
    }

    const script = document.createElement('script');
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = false;
    script.defer = true;
    script.onload = markLoaded;
    script.onerror = () => {
      onErrorRef.current?.();
    };

    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !TURNSTILE_SITE_KEY) {
      return;
    }

    let cancelled = false;

    const runRender = () => {
      if (cancelled || !containerRef.current) {
        return;
      }

      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
        }
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        size,
        theme: 'auto',
        callback: (token) => {
          onVerifyRef.current(token);
        },
        'error-callback': () => {
          onErrorRef.current?.();
        },
        'expired-callback': () => {
          onExpireRef.current?.();
        },
      });
    };

    runRender();

    return () => {
      cancelled = true;
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
        }
        widgetIdRef.current = null;
      }
    };
  }, [isLoaded, action, size]);

  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="w-full"
    />
  );
};

export default TurnstileWidget;
