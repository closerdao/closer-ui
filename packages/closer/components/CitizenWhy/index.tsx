import { useTranslations } from 'next-intl';

import { Textarea } from '../ui';

interface Props {
  updateApplication: (key: string, value: any) => void;
  application: any;
  buyMore?: boolean;
}

const CitizenWhy = ({ updateApplication, application }: Props) => {
  const t = useTranslations();

  return (
    <div className="space-y-2">
      <label htmlFor="why">{t('subscriptions_citizen_good_why')}</label>
      <Textarea
        id="why"
        value={application?.why || ''}
        onChange={(e) => updateApplication('why', e.target.value)}
        placeholder={t('generic_input_placeholder')}
      />
    </div>
  );
};

export default CitizenWhy;
