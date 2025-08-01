import { FC } from 'react';

import { FaTelegram } from '@react-icons/all-files/fa/FaTelegram';
import { RiFacebookFill } from '@react-icons/all-files/ri/RiFacebookFill';
import { SiDiscord } from '@react-icons/all-files/si/SiDiscord';
import { SiInstagram } from '@react-icons/all-files/si/SiInstagram';
import { SiTwitter } from '@react-icons/all-files/si/SiTwitter';
import { useTranslations } from 'next-intl';

import { useConfig } from '../hooks/useConfig';
import { useNewsletter } from '../contexts/newsletter';
import Newsletter from './Newsletter';

const Footer: FC = () => {
  const t = useTranslations();
  
  // Safely use newsletter context
  let hideFooterNewsletter = false;
  try {
    const newsletterContext = useNewsletter();
    hideFooterNewsletter = newsletterContext.hideFooterNewsletter;
  } catch (error) {
    // Context not available during SSR, that's okay
  }
  
  // TODO: switch to per-page config fetching if we ever need this page
  const config = useConfig();
  const {
    DISCORD_URL,
    FACEBOOK_URL,
    INSTAGRAM_URL,
    TELEGRAM_URL,
    TWITTER_URL,
  } = config || {};
  return (
    <div>
      <footer className="flex flex-col items-center p-4 main-content text-center">
        <div className="flex flex-col md:flex-row py-2 items-center w-full justify-between">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex flex-row mb-8 md:mb-1">
              {INSTAGRAM_URL && (
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer nofollow"
                  title="Follow us on Instagram"
                  className="text-2xl mr-2 rounded-full hover:text-gray-100 hover:bg-accent p-2 text-accent dark:text-background bg-transparent duration-300 hover:scale-110"
                >
                  <SiInstagram />
                </a>
              )}
              {FACEBOOK_URL && (
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noreferrer nofollow"
                  title="Follow us on Facebook"
                  className="text-2xl mr-2 rounded-full hover:text-gray-100 hover:bg-accent p-2 text-accent dark:text-background bg-transparent duration-300 hover:scale-110"
                >
                  <RiFacebookFill />
                </a>
              )}
              {TWITTER_URL && (
                <a
                  href={TWITTER_URL}
                  target="_blank"
                  rel="noreferrer nofollow"
                  title="Follow us on Twitter"
                  className="text-2xl mr-2 rounded-full hover:text-gray-100 hover:bg-accent p-2 text-accent dark:text-background bg-transparent duration-300 hover:scale-110"
                >
                  <SiTwitter />
                </a>
              )}
              {DISCORD_URL && (
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noreferrer nofollow"
                  title="Join Discord server"
                  className="text-2xl mr-2 rounded-full hover:text-gray-100 hover:bg-accent p-2 text-accent dark:text-background bg-transparent duration-300 hover:scale-110"
                >
                  <SiDiscord />
                </a>
              )}
              {TELEGRAM_URL && (
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer nofollow"
                  title="Join Telegram Group"
                  className="text-2xl mr-2 rounded-full hover:text-gray-100 hover:bg-accent p-2 text-accent dark:text-background bg-transparent duration-300 hover:scale-110"
                >
                  <FaTelegram />
                </a>
              )}
            </div>
            <div className="flex flex-col items-start mt-8 text-gray-500">
              <p className="text-xs">
                {t('footer_phrase')}{' '}
                <a href="https://closer.earth" className="underline">
                  {t('footer_platform')}
                </a>
              </p>
            </div>
          </div>

          {!hideFooterNewsletter && (
            <div className='w-full flex justify-center'>
              <Newsletter placement="Footer" />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Footer;
