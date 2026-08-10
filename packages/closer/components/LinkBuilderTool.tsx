import { useState } from 'react';
import Image from 'next/image';
import { Card, Heading, Input, Button } from './ui';

interface LinkBuilderToolProps {
  userId: string;
  onLinkGenerated?: (link: string) => void;
}

const LinkBuilderTool = ({ userId, onLinkGenerated }: LinkBuilderToolProps) => {
  const [inputUrl, setInputUrl] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'traditionaldreamfactory.com' || 
             urlObj.hostname === 'www.traditionaldreamfactory.com' ||
             urlObj.hostname.endsWith('.traditionaldreamfactory.com');
    } catch {
      return false;
    }
  };

  const generateTrackingLink = () => {
    setError('');
    
    if (!inputUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Add protocol if missing
    let urlToProcess = inputUrl.trim();
    if (!urlToProcess.startsWith('http://') && !urlToProcess.startsWith('https://')) {
      urlToProcess = `https://${urlToProcess}`;
    }

    if (!validateUrl(urlToProcess)) {
      setError('Please enter a valid URL from traditionaldreamfactory.com domain');
      return;
    }

    // Generate tracking link
    const url = new URL(urlToProcess);
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
    <Card className="p-6">
      <Heading level={3} className="text-lg font-bold mb-4">
        🔗 Link Builder Tool
      </Heading>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Enter any URL from traditionaldreamfactory.com:
          </label>
          <Input
            type="text"
            placeholder="https://traditionaldreamfactory.com/events/example"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full mb-3"
          />
          <Button
            onClick={generateTrackingLink}
            variant="primary"
            color="accent"
            className="px-6"
          >
            Generate Link
          </Button>
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>

        {generatedLink && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Your tracking link:
            </label>
            <div className="p-3 bg-gray-50 rounded border text-sm break-all mb-3">
              {generatedLink}
            </div>
            <Button
              onClick={copyToClipboard}
              variant="secondary"
              className="px-4"
            >
              {copied ? (
                <span className="text-green-600">Copied!</span>
              ) : (
                <Image
                  src="/images/icon-copy.svg"
                  alt="Copy"
                  width={18}
                  height={18}
                />
              )}
            </Button>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Enter any URL from traditionaldreamfactory.com</li>
            <li>We&apos;ll automatically add your referral tracking code</li>
            <li>Copy and share the generated link to earn commissions</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default LinkBuilderTool;
