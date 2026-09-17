import { useConfig } from 'closer';
import { MessageCircle } from 'lucide-react';

const DEFAULT_TELEGRAM_URL = 'https://t.me/closerearth';

/**
 * Floating chat button on the landing page. Opens the Closer Telegram group
 * in a new tab.
 */
export default function CloserChatWidget() {
  const config = useConfig();
  const telegramUrl = config?.TELEGRAM_URL || DEFAULT_TELEGRAM_URL;

  return (
    <a
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-foreground text-accent rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
      aria-label="Chat with us on Telegram"
      title="Chat with us on Telegram"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
