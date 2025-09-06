import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { Input } from '../ui';

interface Props {
  updateApplication: (key: string, value: any) => void;
  application: any;
  buyMore?: boolean;
}

const CitizenWhy = ({ updateApplication, application, buyMore }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isMember = user?.roles?.includes('member');

  return (
    <>
      <Input
        label={t('subscriptions_citizen_good_why')}
        value={application?.why || ''}
        onChange={(e) => updateApplication('why', e.target.value)}
        placeholder={t('generic_input_placeholder')}
      />
    </>
  );
};

export default CitizenWhy;
