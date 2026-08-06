import { useTranslations } from 'next-intl';

import {
  VOLUNTEER_AGREEMENT_CLAUSE_KEYS,
  VOLUNTEER_AGREEMENT_VERSION,
} from '../../constants/volunteerApplication';
import type { VolunteerApplicationAgreement } from '../../types/volunteerApplication';
import type { VolunteerApplicationErrors } from '../../utils/volunteerApplication.helpers';
import Checkbox from '../ui/Checkbox';

interface Props {
  agreement: VolunteerApplicationAgreement;
  onChange: (patch: Partial<VolunteerApplicationAgreement>) => void;
  errors: VolunteerApplicationErrors;
  guestRateLabel?: string;
}

const VolunteerApplicationStepAgreement = ({
  agreement,
  onChange,
  errors,
  guestRateLabel,
}: Props) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-line rounded-lg p-4 flex flex-col gap-3 text-sm leading-relaxed text-complimentary-light">
        <p>{t('volunteer_application_agreement_intro')}</p>
        <ol className="list-decimal pl-5 flex flex-col gap-2">
          {VOLUNTEER_AGREEMENT_CLAUSE_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
        {guestRateLabel && (
          <p className="text-complimentary-core">
            {t('volunteer_application_agreement_guest_rate', {
              rate: guestRateLabel,
            })}
          </p>
        )}
      </div>

      <div>
        <Checkbox
          id="volunteer-agreement-accept"
          isChecked={Boolean(agreement.acceptedAt)}
          onChange={(event: any) =>
            onChange(
              event.target.checked
                ? {
                    acceptedAt: new Date().toISOString(),
                    version: VOLUNTEER_AGREEMENT_VERSION,
                  }
                : { acceptedAt: undefined, version: undefined },
            )
          }
        >
          {t('volunteer_application_agreement_accept')}
        </Checkbox>
        {errors.acceptedAt && (
          <p className="text-error text-sm" role="alert">
            {errors.acceptedAt}
          </p>
        )}
      </div>
    </div>
  );
};

export default VolunteerApplicationStepAgreement;
