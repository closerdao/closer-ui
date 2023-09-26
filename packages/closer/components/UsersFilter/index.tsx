import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from 'react';

import {
  SUBSCRIPTION_TIER_OPTIONS,
  USER_CREATED_OPTIONS,
  USER_MEMBER_STATUS_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_SORT_OPTIONS,
  USER_SORT_TITLE_OPTIONS,
} from '../../constants';
import { __, getCreatedPeriodFilter } from '../../utils/helpers';
import { Button, Input } from '../ui';
import Select from '../ui/Select/Dropdown';
import Switcher from '../ui/Switcher';

const initialWhereValues = {
  userRole: 'any',
  subscriptionTier: 'any',
  userCreated: 'any',
  memberStatus: 'any',
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
  const [userRole, setUserRole] = useState('any');
  const [subscriptionTier, setSubscriptionTier] = useState('any');
  const [userCreated, setUserCreated] = useState('any');
  const [userName, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [memberStatus, setMemberStatus] = useState('any');

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
        email: { $regex: whereValues.userEmail },
      }),
      ...(whereValues.userName !== '' && {
        screenname: { $regex: whereValues.userName, $options: 'i' },
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
    setWhereValues(initialWhereValues);
  };

  return (
    <section className="flex gap-2 flex-wrap">
      <div className="md:flex-1 flex-wrap md:flex-nowrap flex gap-2 flex-col md:flex-row w-full md:w-auto mb-4">
        <div className="flex-1 min-w-full md:min-w-[160px]">
          <label className="block my-2">{__('manage_users_role')}</label>
          <Select
            className="rounded-full border-black "
            value={userRole}
            options={USER_ROLE_OPTIONS}
            onChange={handleUserRole}
            isRequired
          />
        </div>
        <div className="flex-1 min-w-full md:min-w-[160px]">
          <label className="block my-2">{__('manage_users_tier')}</label>
          <Select
            className="rounded-full border-black "
            value={subscriptionTier}
            options={SUBSCRIPTION_TIER_OPTIONS}
            onChange={handleSubscriptionTier}
            isRequired
          />
        </div>
        <div className="flex-1 min-w-full md:min-w-[160px]">
          <label className="block my-2">
            {__('manage_users_member_status')}
          </label>
          <Select
            className="rounded-full border-black "
            value={memberStatus}
            options={USER_MEMBER_STATUS_OPTIONS}
            onChange={handleMemberStatus}
            isRequired
          />
        </div>
      </div>

      <div className="md:flex-1 flex-wrap md:flex-nowrap flex gap-2 flex-col md:flex-row w-full md:w-auto mb-4">
        <div className="flex-1 min-w-full md:min-w-[160px]">
          <label className="block my-2">{__('manage_users_created')}</label>
          <Select
            className="rounded-full border-black "
            value={userCreated}
            options={USER_CREATED_OPTIONS}
            onChange={handleUserCreated}
            isRequired
          />
        </div>{' '}
        <div className="flex-1 min-w-[160px]">
          <label className="block my-2">{__('manage_users_name')}</label>
          <Input
            value={userName}
            onChange={handleUserName as any}
            type="text"
            placeholder={__('manage_users_name')}
            className="m-0 border-black border-2 rounded-full py-1.5 bg-white"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block my-2">{__('manage_users_email')}</label>
          <Input
            value={userEmail}
            onChange={handleUserEmail as any}
            type="text"
            placeholder={__('manage_users_email')}
            className="m-0 border-black border-2 rounded-full py-1.5 bg-white"
          />
        </div>
      </div>

      <div className="w-full"> {__('booking_requests_sort_by')}</div>

      <Switcher
        options={USER_SORT_OPTIONS}
        optionsTitles={USER_SORT_TITLE_OPTIONS}
        selectedOption={sortBy}
        setSelectedOption={setSortBy}
      />

      <Button
        onClick={handleClearFilters}
        isFullWidth={false}
        className="my-6"
        type="secondary"
      >
        {__('manage_users_lear_filters_button')}
      </Button>
    </section>
  );
};

export default UsersFilter;
