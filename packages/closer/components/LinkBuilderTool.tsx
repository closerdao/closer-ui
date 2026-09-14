import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button, Card, Heading, Input } from './ui';

interface LinkBuilderToolProps {
  userId: string;
  /**
   * Origin the links have to belong to, e.g. `https://closer.earth`. Defaults
   * to the site the page is running on, so every platform gets its own builder.
   */
  baseUrl?: string;
  onLinkGenerated?: (link: string) => void;
}

const stripWww = (hostname: string) => hostname.replace(/^www\./, '');

const hostOf = (origin: string) => {
  try {
    return stripWww(new URL(origin).hostname);
  } catch {
    return '';
  }
};

const LinkBuilderTool = ({
  userId,
  baseUrl,
  onLinkGenerated,
}: LinkBuilderToolProps) => {
  const t = useTranslations();
  // Read the origin after mount so the server and first client render agree.
  const [origin, setOrigin] = useState(baseUrl || '');
  const [inputUrl, setInputUrl] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (baseUrl) {
      setOrigin(baseUrl);
    } else if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, [baseUrl]);

  const host = hostOf(origin);

  const isOnPlatform = (url: URL) => {
    if (!host) return true;
    const candidate = stripWww(url.hostname);
    return candidate === host || candidate.endsWith(`.${host}`);
  };

  const generateTrackingLink = () => {
    setError('');

    if (!inputUrl.trim()) {
      setError(t('affiliate_link_builder_error_empty'));
      return;
    }

    let urlToProcess = inputUrl.trim();
    if (!/^https?:\/\//i.test(urlToProcess)) {
      urlToProcess = `https://${urlToProcess}`;
    }

    let url: URL;
    try {
      url = new URL(urlToProcess);
    } catch {
      setError(t('affiliate_link_builder_error_domain', { host }));
      return;
    }
    if (!isOnPlatform(url)) {
      setError(t('affiliate_link_builder_error_domain', { host }));
      return;
    }

    url.searchParams.set('referral', userId);
    const trackingLink = url.toString();
    setGeneratedLink(trackingLink);
    onLinkGenerated?.(trackingLink);
  };

  const copyToClipboard = async () => {
    if (!navigator?.clipboard) {
      console.error('Clipboard API not available');
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <Card className="p-6 md:p-8 shadow-none border border-line/40 rounded-2xl bg-background">
      <div className="flex flex-col gap-6">
        <div>
          <Heading level={3} className="text-lg">
            🔗 {t('affiliate_link_builder_title')}
          </Heading>
          <p className="text-sm text-foreground/70 mt-1">
            {t('affiliate_link_builder_intro', { host })}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <label
            className="block text-sm font-medium"
            htmlFor="affiliate-link-builder-url"
          >
            {t('affiliate_link_builder_label', { host })}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="affiliate-link-builder-url"
              type="text"
              placeholder={`${origin || 'https://'}/events/example`}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full"
            />
            <Button
              onClick={generateTrackingLink}
              variant="primary"
              color="accent"
              isFullWidth={false}
              className="px-6 whitespace-nowrap"
            >
              {t('affiliate_link_builder_generate')}
            </Button>
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
        </div>

        {generatedLink && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {t('affiliate_link_builder_result_label')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <code
                data-testid="affiliate-tracking-link"
                className="flex-1 p-3 bg-accent-light/40 border border-accent/20 rounded-lg text-sm break-all"
              >
                {generatedLink}
              </code>
              <Button
                onClick={copyToClipboard}
                variant="secondary"
                color="accent"
                isFullWidth={false}
                className="px-4 whitespace-nowrap"
              >
                {copied
                  ? t('affiliate_link_builder_copied')
                  : t('affiliate_link_builder_copy')}
              </Button>
            </div>
          </div>
        )}

        <ol className="text-sm text-foreground/70 list-decimal list-inside space-y-1">
          <li>{t('affiliate_link_builder_how_1', { host })}</li>
          <li>{t('affiliate_link_builder_how_2')}</li>
          <li>{t('affiliate_link_builder_how_3')}</li>
        </ol>
      </div>
    </Card>
  );
};

export default LinkBuilderTool;
