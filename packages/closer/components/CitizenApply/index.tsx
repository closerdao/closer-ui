import { useTranslations } from 'next-intl';

import { Button, Checkbox } from '../ui';

interface CitizenApplyProps {
  isAgreementAccepted: boolean;
  setIsAgreementAccepted: (value: boolean) => void;
  applyCitizen: () => void;
  loading: boolean;
}

const CitizenApply = ({
  isAgreementAccepted,
  setIsAgreementAccepted,
  applyCitizen,
  loading,
}: CitizenApplyProps) => {
  const t = useTranslations();
  return (
    <section className="space-y-6">
      <p className="font-bold">{t('subscriptions_citizen_read_agreement')}</p>

      <div className="flex items-start gap-1">
        <Checkbox
          id="citizen-agreement"
          isChecked={isAgreementAccepted}
          onChange={() => setIsAgreementAccepted(!isAgreementAccepted)}
        />
        <label htmlFor="citizen-agreement">
          {t.rich('subscriptions_citizen_agree_to_terms', {
            link: (chunks) => (
              <a
                href="https://docs.google.com/document/d/1mkWDWXIaf2ZuRu7NU1Xlr9leGYmjWd3HXRJDCzTSttY/edit?tab=t.0"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline' }}
              >
                {chunks}
              </a>
            ),
          })}
        </label>
      </div>
      <Button
        isEnabled={isAgreementAccepted && !loading}
        className="booking-btn"
        onClick={applyCitizen}
      >
        {t('subscriptions_citizen_become_citizen')}
      </Button>
    </section>
  );
};

export default CitizenApply;
