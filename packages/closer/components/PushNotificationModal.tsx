import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Bell } from 'lucide-react';

import { useAuth } from '../contexts/auth';
import { usePushNotifications } from '../contexts/push-notifications';
import Modal from './Modal';
import { Button } from './ui';

const SHOW_DELAY_MS = 3000;

const PushNotificationModal = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { isSupported, isCommunityEnabled, permission, wasPrompted, subscribe, dismissPrompt } =
    usePushNotifications();

  const [isVisible, setIsVisible] = useState(false);

  const shouldShow =
    Boolean(user) &&
    isCommunityEnabled &&
    isSupported &&
    !wasPrompted &&
    permission === 'default';

  useEffect(() => {
    if (!shouldShow) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [shouldShow]);

  if (!isVisible) return null;

  const handleEnable = async () => {
    await subscribe();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    dismissPrompt();
    setIsVisible(false);
  };

  return (
    <Modal closeModal={handleDismiss} className="md:w-[400px] md:h-auto h-auto">
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
          <Bell className="w-6 h-6 text-accent" />
        </div>
        <h3 className="text-xl font-bold">
          {t('push_notification_modal_title')}
        </h3>
        <p className="text-gray-600 text-sm">
          {t('push_notification_modal_body')}
        </p>
        <div className="flex flex-col gap-2 w-full mt-2">
          <Button onClick={handleEnable}>
            {t('push_notification_modal_enable')}
          </Button>
          <button
            onClick={handleDismiss}
            className="text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            {t('push_notification_modal_dismiss')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PushNotificationModal;
