import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from 'react';

import { useTranslations } from 'next-intl';

import {
  SUBSCRIPTION_TIER_OPTIONS,
  USER_CREATED_OPTIONS,
  USER_MEMBER_STATUS_OPTIONS,
  USER_ROLE_OPTIONS,
} from '../../constants';
import { getCreatedPeriodFilter } from '../../utils/helpers';
import { Input } from '../ui';
import Select from '../ui/Select/Dropdown';

const initialWhereValues = {
  userRole: 'any',
  subscriptionTier: 'any',
  userCreated: 'any',
  memberStatus: 'any',
  kycStatus: 'any',
  userName: '',
  userEmail: '',
};

interface Props {
  setWhere: Dispatch<SetStateAction<any>>;
  setPage: Dispatch<SetStateAction<number>>;
  page: number;
  sortBy: string;
  setSortBy: Dispatch<SetStateAction<string>>;
}

const UsersFilter = ({ setWhere, setPage, page, sortBy, setSortBy }: Props) => {
  const t = useTranslations();
  const [userRole, setUserRole] = useState('any');
  const [subscriptionTier, setSubscriptionTier] = useState('any');
  const [userCreated, setUserCreated] = useState('any');
  const [userName, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [memberStatus, setMemberStatus] = useState('any');
  const [kycStatus, setKycStatus] = useState('any');

  const [whereValues, setWhereValues] = useState(initialWhereValues);

  useEffect(() => {
    setPage(1);
  }, [whereValues]);

  useEffect(() => {
    const getWhere = {
      ...(whereValues.userRole !== 'any' && { roles: userRole }),

      ...(whereValues.subscriptionTier !== 'any' &&
        whereValues.subscriptionTier !== 'explorer' && {
          'subscription.plan': subscriptionTier,
        }),
      ...(whereValues.subscriptionTier === 'explorer' && {
        'subscription.plan': { $exists: false },
      }),

      ...(whereValues.memberStatus === 'any'
        ? {}
        : whereValues.memberStatus === 'member'
        ? { roles: memberStatus }
        : { roles: { $ne: 'member' } }),
      ...(whereValues.userCreated !== 'any' && {
        created: getCreatedPeriodFilter(userCreated),
      }),
      ...(whereValues.userEmail !== '' && {
        email: { $regex: whereValues.userEmail, $options: 'i' },
      }),
      ...(whereValues.userName !== '' && {
        screenname: { $regex: whereValues.userName, $options: 'i' },
      }),
      ...(whereValues.kycStatus !== 'any' && {
        kycPassed: whereValues.kycStatus === 'passed',
      }),
    };
    setWhere(getWhere);
  }, [page, whereValues]);

  const handleUserRole = (value: string) => {
    setMemberStatus('any');
    setUserRole(value);
    setWhereValues({
      ...whereValues,
      userRole: value,
      memberStatus: 'any',
    });
  };
  const handleMemberStatus = (value: string) => {
    setUserRole('any');
    setMemberStatus(value);
    setWhereValues({
      ...whereValues,
      memberStatus: value,
      userRole: 'any',
    });
  };

  const handleSubscriptionTier = (value: string) => {
    setSubscriptionTier(value);
    setWhereValues({
      ...whereValues,
      subscriptionTier: value,
    });
  };

  const handleUserCreated = (value: string) => {
    setUserCreated(value);
    setWhereValues({
      ...whereValues,
      userCreated: value,
    });
  };

  const handleKycStatus = (value: string) => {
    setKycStatus(value);
    setWhereValues({
      ...whereValues,
      kycStatus: value,
    });
  };

  const handleUserEmail = (e: ChangeEvent<HTMLInputElement>) => {
    setUserEmail(e.target.value);
    setWhereValues({
      ...whereValues,
      userEmail: e.target.value,
    });
  };
  const handleUserName = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setWhereValues({
      ...whereValues,
      userName: e.target.value,
    });
  };

  const handleClearFilters = () => {
    setSubscriptionTier('any');
    setUserRole('any');
    setUserCreated('any');
    setMemberStatus('any');
    setUsername('');
    setUserEmail('');
    setKycStatus('any');
    setWhereValues(initialWhereValues);
  };

  return (
    <section className="space-y-2 mb-2">
      {/* Header with Clear Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">{t('manage_users_filters')}</h2>
        <button
          onClick={handleClearFilters}
          className="text-primary underline hover:text-primary/80 text-sm cursor-pointer"
        >
          {t('manage_users_clear_filters')}
        </button>
      </div>

      {/* User Identity Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('manage_users_identity_filters')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('manage_users_name')}</label>
            <Input
              value={userName}
              onChange={handleUserName as any}
              type="text"
              placeholder={t('manage_users_name')}
              className="w-full border-gray-300 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('manage_users_email')}</label>
            <Input
              value={userEmail}
              onChange={handleUserEmail as any}
              type="text"
              placeholder={t('manage_users_email')}
              className="w-full border-gray-300 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('manage_users_created')}</label>
            <Select
              className="w-full border-gray-300 rounded-lg"
              value={userCreated}
              options={USER_CREATED_OPTIONS}
              onChange={handleUserCreated}
              isRequired
            />
          </div>
        </div>
      </div>

      {/* Status & Permissions Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('manage_users_status_filters')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('manage_users_role')}</label>
            <Select
              className="w-full border-gray-300 rounded-lg min-w-[120px]"
              value={userRole}
              options={USER_ROLE_OPTIONS}
              onChange={handleUserRole}
              isRequired
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('manage_users_tier')}</label>
            <Select
              className="w-full border-gray-300 rounded-lg min-w-[120px]"
              value={subscriptionTier}
              options={SUBSCRIPTION_TIER_OPTIONS}
              onChange={handleSubscriptionTier}
              isRequired
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('manage_users_member_status')}</label>
            <Select
              className="w-full border-gray-300 rounded-lg min-w-[120px]"
              value={memberStatus}
              options={USER_MEMBER_STATUS_OPTIONS}
              onChange={handleMemberStatus}
              isRequired
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('manage_users_kyc_status')}</label>
            <Select
              className="w-full border-gray-300 rounded-lg min-w-[120px]"
              value={kycStatus}
              options={[
                { value: 'any', label: t('manage_users_kyc_status_any') },
                { value: 'passed', label: t('manage_users_kyc_status_passed') },
                { value: 'not_passed', label: t('manage_users_kyc_status_not_passed') },
              ]}
              onChange={handleKycStatus}
              isRequired
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default UsersFilter;
