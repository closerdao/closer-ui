import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface JoinCommunityCTAProps {
  variant?: 'default' | 'compact' | 'banner';
  className?: string;
  telegramUrl?: string;
}

const JoinCommunityCTA = ({
  variant = 'default',
  className = '',
  telegramUrl = 'https://t.me/traditionaldreamfactor',
}: JoinCommunityCTAProps) => {
  const t = useTranslations();

  if (variant === 'compact') {
    return (
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#006699] text-white rounded-lg transition-colors text-sm font-medium ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        {t('join_community_telegram_button')}
      </a>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`bg-gradient-to-r from-[#0088cc] to-[#00aced] rounded-xl p-6 text-white ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-lg">
                {t('join_community_banner_title')}
              </p>
              <p className="text-white/80 text-sm">
                {t('join_community_banner_subtitle')}
              </p>
            </div>
          </div>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0088cc] hover:bg-gray-100 rounded-lg transition-colors font-semibold whitespace-nowrap"
          >
            <MessageCircle className="w-5 h-5" />
            {t('join_community_telegram_button')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-xl p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-[#0088cc] rounded-lg flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 mb-1">
            {t('join_community_title')}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {t('join_community_description')}
          </p>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#006699] text-white rounded-lg transition-colors text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            {t('join_community_telegram_button')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default JoinCommunityCTA;
