import { MouseEvent, useState } from 'react';

import { Heading, Modal, Newsletter } from 'closer';
import { useConfig } from 'closer';

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
  const { LOGO_HEADER, PLATFORM_NAME } = useConfig();
  const [hasSubscribed, setHasSubscribed] = useState(false);

  const handleSubscriptionSuccess = () => {
    setHasSubscribed(true);
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
          Download TDF {reportYear} Report
        </Heading>

        <p className=" max-w-md">
          Subscribe to our newsletter to stay updated with our progress and get
          instant access to the {reportYear} report.
        </p>
        <Newsletter
          placement={`Report${reportYear}Download`}
          ctaText={hasSubscribed ? 'Thanks for subscribing!' : 'Get the report'}
          onSuccess={handleSubscriptionSuccess}
          className="px-0 py-4"
        />
      </div>
    </Modal>
  );
};

export default ReportDownloadModal;
