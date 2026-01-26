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
    onTurnstileLoad?: () => void;
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_KEY || '';

interface TurnstileWidgetProps {
  action?: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

const TurnstileWidget = ({
  action = 'submit',
  onVerify,
  onError,
  onExpire,
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      return;
    }

    if (window.turnstile) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.turnstile) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const script = document.createElement('script');
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
    script.async = true;

    window.onTurnstileLoad = () => {
      setIsLoaded(true);
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !TURNSTILE_SITE_KEY) {
      return;
    }

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {
        // Ignore
      }
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action,
      size: 'flexible',
      theme: 'auto',
      callback: onVerify,
      'error-callback': () => {
        onError?.();
      },
      'expired-callback': () => {
        onExpire?.();
      },
    });

    return () => {
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [isLoaded, action, onVerify, onError, onExpire]);

  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden [&_iframe]:w-full [&_iframe]:!rounded-lg"
    />
  );
};

export default TurnstileWidget;
