import { MouseEvent, useState } from 'react';

import { Heading, Modal, Newsletter, Button } from 'closer';
import { useConfig, useAuth } from 'closer';
import { useTranslations } from 'next-intl';

interface ReportDownloadModalProps {
  closeModal: (event: MouseEvent<HTMLButtonElement>) => void;
  reportYear: string;
  reportUrl: string;
}

const ReportDownloadModal = ({
  closeModal,
  reportYear,
  reportUrl,
}: ReportDownloadModalProps) => {
  const t = useTranslations();
  const { LOGO_HEADER, PLATFORM_NAME } = useConfig();
  const { isAuthenticated } = useAuth();
  const [hasSubscribed, setHasSubscribed] = useState(false);

  const handleSubscriptionSuccess = () => {
    setHasSubscribed(true);
    window.open(reportUrl, '_blank');
  };

  const handleDirectDownload = () => {
    window.open(reportUrl, '_blank');
  };

  return (
    <Modal closeModal={closeModal} className='!h-[440px] pb-8'>
      <div className="flex flex-col gap-4 py-2">
        <img
          src={LOGO_HEADER}
          alt={PLATFORM_NAME}
          // className="h-12 object-cover object-left"
          width={110}
          height={110}
        />
        <Heading level={2} className="text-2xl font-bold ">
          {t('report_download_modal_title', { year: reportYear })}
        </Heading>

        {isAuthenticated ? (
          <>
            <p className=" max-w-md">
              {t('report_download_modal_authenticated_message', { year: reportYear })}
            </p>
            <Button
              onClick={handleDirectDownload}
              className="w-full"
            >
              {t('report_download_modal_download_button', { year: reportYear })}
            </Button>
          </>
        ) : (
          <>
            <p className=" max-w-md">
              {t('report_download_modal_subscription_message', { year: reportYear })}
            </p>
            <Newsletter
              placement={`Report${reportYear}Download`}
              ctaText={hasSubscribed ? t('report_download_modal_thanks_subscribing') : t('report_download_modal_get_report')}
              onSuccess={handleSubscriptionSuccess}
              className="px-0 py-4"
            />
          </>
        )}
      </div>
    </Modal>
  );
};

export default ReportDownloadModal;
